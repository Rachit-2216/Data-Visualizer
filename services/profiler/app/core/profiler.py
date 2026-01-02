import polars as pl
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import io
import time


@dataclass
class ColumnProfile:
    name: str
    dtype: str
    inferred_type: str
    count: int
    missing_count: int
    missing_percentage: float
    unique_count: int
    unique_percentage: float

    # Numeric stats
    mean: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    median: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    p1: Optional[float] = None
    p5: Optional[float] = None
    p95: Optional[float] = None
    p99: Optional[float] = None

    # Categorical stats
    top_values: Optional[List[Dict]] = None

    # Histogram
    histogram: Optional[Dict] = None


class DataProfiler:
    def __init__(self, max_sample_size: int = 50000):
        self.max_sample_size = max_sample_size

    def profile_dataframe(self, df: pl.DataFrame) -> Dict[str, Any]:
        """Profile a Polars DataFrame and return comprehensive statistics."""
        start_time = time.time()

        row_count = len(df)
        column_count = len(df.columns)

        # Sample if needed
        if row_count > self.max_sample_size:
            df_sample = df.sample(n=self.max_sample_size, seed=42)
            sampled = True
        else:
            df_sample = df
            sampled = False

        # Profile each column
        columns = []
        for col_name in df.columns:
            col_profile = self._profile_column(df_sample, col_name)
            columns.append(asdict(col_profile))

        # Compute correlations for numeric columns
        numeric_cols = [c for c in df.columns if df[c].dtype in [pl.Float64, pl.Int64, pl.Float32, pl.Int32]]
        correlations = self._compute_correlations(df_sample, numeric_cols)

        # Compute missing patterns
        missing = self._analyze_missing(df_sample)

        # Generate warnings
        warnings = self._generate_warnings(columns, correlations)

        # Generate chart specs
        charts = self._generate_chart_specs(columns, correlations)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "schema": {
                "columns": [
                    {
                        "name": c["name"],
                        "inferred_type": c["inferred_type"],
                        "null_frac": c["missing_percentage"] / 100,
                        "unique_frac": c["unique_percentage"] / 100,
                        "sample_values": [],
                    }
                    for c in columns
                ]
            },
            "stats": {
                "row_count": row_count,
                "column_count": column_count,
                "memory_est_mb": df.estimated_size() / (1024 * 1024),
            },
            "columns": columns,
            "correlations": correlations,
            "missing": missing,
            "warnings": warnings,
            "charts": charts,
            "meta": {
                "profiled_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "processing_time_ms": processing_time_ms,
                "sample_size": len(df_sample),
                "sampled": sampled,
            },
        }

    def _infer_type(self, series: pl.Series) -> str:
        """Infer semantic type from a series."""
        dtype = series.dtype

        # Check for numeric types
        if dtype in [pl.Float64, pl.Float32, pl.Int64, pl.Int32, pl.Int16, pl.Int8]:
            unique_ratio = series.n_unique() / len(series)
            # Low cardinality numeric might be categorical
            if unique_ratio < 0.05 and series.n_unique() < 20:
                return "categorical"
            return "numeric"

        # Check for boolean
        if dtype == pl.Boolean:
            return "boolean"

        # Check for datetime
        if dtype in [pl.Datetime, pl.Date, pl.Time]:
            return "datetime"

        # String types - check for patterns
        if dtype == pl.Utf8:
            sample = series.drop_nulls().head(100)
            unique_ratio = series.n_unique() / max(len(series), 1)

            # High cardinality with numeric-like pattern might be ID
            if unique_ratio > 0.9:
                return "id"

            # Low cardinality is categorical
            if series.n_unique() < 50:
                return "categorical"

            return "text"

        return "text"

    def _profile_column(self, df: pl.DataFrame, col_name: str) -> ColumnProfile:
        """Profile a single column."""
        series = df[col_name]
        count = len(series)
        missing_count = series.null_count()
        missing_percentage = (missing_count / count) * 100 if count > 0 else 0
        unique_count = series.n_unique()
        unique_percentage = (unique_count / count) * 100 if count > 0 else 0

        inferred_type = self._infer_type(series)

        profile = ColumnProfile(
            name=col_name,
            dtype=str(series.dtype),
            inferred_type=inferred_type,
            count=count,
            missing_count=missing_count,
            missing_percentage=round(missing_percentage, 2),
            unique_count=unique_count,
            unique_percentage=round(unique_percentage, 2),
        )

        # Numeric stats
        if inferred_type == "numeric":
            clean_series = series.drop_nulls()
            if len(clean_series) > 0:
                profile.mean = float(clean_series.mean())
                profile.std = float(clean_series.std())
                profile.min = float(clean_series.min())
                profile.max = float(clean_series.max())
                profile.median = float(clean_series.median())
                profile.q1 = float(clean_series.quantile(0.25))
                profile.q3 = float(clean_series.quantile(0.75))
                profile.p1 = float(clean_series.quantile(0.01))
                profile.p5 = float(clean_series.quantile(0.05))
                profile.p95 = float(clean_series.quantile(0.95))
                profile.p99 = float(clean_series.quantile(0.99))

                # Histogram
                try:
                    counts, bin_edges = np.histogram(clean_series.to_numpy(), bins=50)
                    profile.histogram = {
                        "bins": bin_edges.tolist(),
                        "counts": counts.tolist(),
                    }
                except:
                    pass

        # Categorical stats
        elif inferred_type in ["categorical", "id", "text"]:
            value_counts = series.value_counts().head(20)
            profile.top_values = [
                {
                    "value": str(row[0]),
                    "count": int(row[1]),
                    "percentage": round((row[1] / count) * 100, 2),
                }
                for row in value_counts.iter_rows()
            ]

        return profile

    def _compute_correlations(self, df: pl.DataFrame, numeric_cols: List[str]) -> Dict:
        """Compute correlation matrix for numeric columns."""
        if len(numeric_cols) < 2:
            return {"columns": numeric_cols, "pearson": []}

        try:
            # Convert to numpy for correlation
            numeric_df = df.select(numeric_cols).fill_null(0).to_numpy()
            corr_matrix = np.corrcoef(numeric_df.T)

            return {
                "columns": numeric_cols,
                "pearson": [[round(c, 4) for c in row] for row in corr_matrix.tolist()],
            }
        except:
            return {"columns": numeric_cols, "pearson": []}

    def _analyze_missing(self, df: pl.DataFrame) -> Dict:
        """Analyze missing value patterns."""
        missing_per_column = []
        total_missing = 0

        for col in df.columns:
            null_count = df[col].null_count()
            total_missing += null_count
            if null_count > 0:
                missing_per_column.append({
                    "column": col,
                    "count": null_count,
                    "percentage": round((null_count / len(df)) * 100, 2),
                })

        # Sort by count descending
        missing_per_column.sort(key=lambda x: x["count"], reverse=True)

        return {
            "total_missing": total_missing,
            "total_missing_percentage": round(
                (total_missing / (len(df) * len(df.columns))) * 100, 2
            ),
            "columns_with_missing": missing_per_column,
        }

    def _generate_warnings(self, columns: List[Dict], correlations: Dict) -> List[Dict]:
        """Generate data quality warnings."""
        warnings = []

        for col in columns:
            # High missing values
            if col["missing_percentage"] > 30:
                warnings.append({
                    "code": "HIGH_MISSING",
                    "severity": "high" if col["missing_percentage"] > 50 else "med",
                    "message": f"Column '{col['name']}' has {col['missing_percentage']}% missing values",
                    "columns": [col["name"]],
                })

            # Constant column
            if col["unique_count"] == 1:
                warnings.append({
                    "code": "CONSTANT_COLUMN",
                    "severity": "med",
                    "message": f"Column '{col['name']}' is constant (single value)",
                    "columns": [col["name"]],
                })

            # High cardinality
            if col["inferred_type"] == "categorical" and col["unique_percentage"] > 90:
                warnings.append({
                    "code": "HIGH_CARDINALITY",
                    "severity": "low",
                    "message": f"Column '{col['name']}' has high cardinality ({col['unique_count']} unique values)",
                    "columns": [col["name"]],
                })

        # High correlations
        if correlations.get("pearson") and len(correlations["pearson"]) > 0:
            cols = correlations["columns"]
            matrix = correlations["pearson"]
            for i in range(len(cols)):
                for j in range(i + 1, len(cols)):
                    if abs(matrix[i][j]) > 0.95:
                        warnings.append({
                            "code": "HIGH_CORRELATION",
                            "severity": "med",
                            "message": f"High correlation ({matrix[i][j]:.2f}) between '{cols[i]}' and '{cols[j]}'",
                            "columns": [cols[i], cols[j]],
                        })

        return warnings

    def _generate_chart_specs(self, columns: List[Dict], correlations: Dict) -> List[Dict]:
        """Generate Vega-Lite chart specifications for auto-EDA."""
        charts = []

        # Summary charts
        charts.append({
            "key": "column_types",
            "title": "Column Types Distribution",
            "section": "summary",
            "spec": self._create_type_distribution_spec(columns),
        })

        charts.append({
            "key": "missing_values",
            "title": "Missing Values by Column",
            "section": "summary",
            "spec": self._create_missing_bar_spec(columns),
        })

        # Distribution charts for numeric columns
        numeric_cols = [c for c in columns if c["inferred_type"] == "numeric"]
        for i, col in enumerate(numeric_cols[:6]):
            if col.get("histogram"):
                charts.append({
                    "key": f"dist_{col['name']}",
                    "title": f"Distribution of {col['name']}",
                    "section": "distributions",
                    "spec": self._create_histogram_spec(col),
                })

        # Box plots for numeric columns
        for i, col in enumerate(numeric_cols[:4]):
            charts.append({
                "key": f"box_{col['name']}",
                "title": f"{col['name']} Box Plot",
                "section": "outliers",
                "spec": self._create_box_spec(col),
            })

        # Bar charts for categorical columns
        cat_cols = [c for c in columns if c["inferred_type"] == "categorical"]
        for i, col in enumerate(cat_cols[:4]):
            if col.get("top_values"):
                charts.append({
                    "key": f"cat_{col['name']}",
                    "title": f"{col['name']} Distribution",
                    "section": "categoricals",
                    "spec": self._create_category_bar_spec(col),
                })

        # Correlation heatmap
        if correlations.get("pearson") and len(correlations["pearson"]) >= 2:
            charts.append({
                "key": "correlation_matrix",
                "title": "Correlation Matrix",
                "section": "correlations",
                "spec": self._create_correlation_heatmap_spec(correlations),
            })

        return charts

    def _create_type_distribution_spec(self, columns: List[Dict]) -> Dict:
        type_counts = {}
        for col in columns:
            t = col["inferred_type"]
            type_counts[t] = type_counts.get(t, 0) + 1

        data = [{"type": k, "count": v} for k, v in type_counts.items()]

        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data},
            "mark": "arc",
            "encoding": {
                "theta": {"field": "count", "type": "quantitative"},
                "color": {"field": "type", "type": "nominal"},
            },
        }

    def _create_missing_bar_spec(self, columns: List[Dict]) -> Dict:
        data = [
            {"column": c["name"], "missing": c["missing_percentage"]}
            for c in columns
            if c["missing_percentage"] > 0
        ]
        data.sort(key=lambda x: x["missing"], reverse=True)

        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data[:15]},
            "mark": "bar",
            "encoding": {
                "x": {"field": "missing", "type": "quantitative", "title": "Missing %"},
                "y": {"field": "column", "type": "nominal", "sort": "-x"},
            },
        }

    def _create_histogram_spec(self, col: Dict) -> Dict:
        if not col.get("histogram"):
            return {}

        bins = col["histogram"]["bins"]
        counts = col["histogram"]["counts"]

        # Create bin center values
        data = []
        for i in range(len(counts)):
            data.append({
                "bin_start": bins[i],
                "bin_end": bins[i + 1],
                "count": counts[i],
            })

        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data},
            "mark": "bar",
            "encoding": {
                "x": {"field": "bin_start", "type": "quantitative", "title": col["name"]},
                "x2": {"field": "bin_end"},
                "y": {"field": "count", "type": "quantitative"},
            },
        }

    def _create_box_spec(self, col: Dict) -> Dict:
        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": [{"col": col["name"]}]},
            "mark": {"type": "boxplot", "extent": "min-max"},
            "encoding": {
                "y": {"field": "col", "type": "nominal"},
            },
            "title": f"{col['name']} Distribution",
        }

    def _create_category_bar_spec(self, col: Dict) -> Dict:
        if not col.get("top_values"):
            return {}

        data = [{"value": v["value"], "count": v["count"]} for v in col["top_values"][:10]]

        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data},
            "mark": "bar",
            "encoding": {
                "x": {"field": "count", "type": "quantitative"},
                "y": {"field": "value", "type": "nominal", "sort": "-x"},
            },
        }

    def _create_correlation_heatmap_spec(self, correlations: Dict) -> Dict:
        cols = correlations["columns"]
        matrix = correlations["pearson"]

        data = []
        for i, col1 in enumerate(cols):
            for j, col2 in enumerate(cols):
                data.append({
                    "var1": col1,
                    "var2": col2,
                    "correlation": matrix[i][j],
                })

        return {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": {"values": data},
            "mark": "rect",
            "encoding": {
                "x": {"field": "var1", "type": "nominal"},
                "y": {"field": "var2", "type": "nominal"},
                "color": {
                    "field": "correlation",
                    "type": "quantitative",
                    "scale": {"scheme": "redblue", "domain": [-1, 1]},
                },
            },
        }

    def create_demo_profile(self) -> Dict:
        """Create a demo profile for testing without actual data."""
        return {
            "schema": {
                "columns": [
                    {"name": "PassengerId", "inferred_type": "id", "null_frac": 0, "unique_frac": 1, "sample_values": ["1", "2", "3"]},
                    {"name": "Survived", "inferred_type": "categorical", "null_frac": 0, "unique_frac": 0.002, "sample_values": ["0", "1"]},
                    {"name": "Pclass", "inferred_type": "categorical", "null_frac": 0, "unique_frac": 0.003, "sample_values": ["1", "2", "3"]},
                    {"name": "Name", "inferred_type": "text", "null_frac": 0, "unique_frac": 1, "sample_values": ["Braund, Mr. Owen"]},
                    {"name": "Sex", "inferred_type": "categorical", "null_frac": 0, "unique_frac": 0.002, "sample_values": ["male", "female"]},
                    {"name": "Age", "inferred_type": "numeric", "null_frac": 0.199, "unique_frac": 0.099, "sample_values": ["22", "38", "26"]},
                    {"name": "SibSp", "inferred_type": "numeric", "null_frac": 0, "unique_frac": 0.008, "sample_values": ["1", "0", "3"]},
                    {"name": "Parch", "inferred_type": "numeric", "null_frac": 0, "unique_frac": 0.008, "sample_values": ["0", "1", "2"]},
                    {"name": "Fare", "inferred_type": "numeric", "null_frac": 0, "unique_frac": 0.279, "sample_values": ["7.25", "71.28", "8.05"]},
                ]
            },
            "stats": {
                "row_count": 891,
                "column_count": 9,
                "memory_est_mb": 0.15,
            },
            "warnings": [
                {"code": "HIGH_MISSING", "severity": "med", "message": "Column 'Age' has 19.9% missing values", "columns": ["Age"]},
                {"code": "HIGH_CARDINALITY", "severity": "low", "message": "Column 'Name' has high cardinality", "columns": ["Name"]},
            ],
            "charts": [],
        }
