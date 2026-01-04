import io
import numpy as np
import polars as pl
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.services.supabase_client import get_service_client
from app.config import get_settings

router = APIRouter()


class VisualRequest(BaseModel):
    kind: str
    seed: int = 42
    dataset_version_id: str | None = None


@router.post("/visuals/simulate")
def simulate_visual(request: VisualRequest, user=Depends(get_current_user)):
    rng = np.random.default_rng(request.seed)
    kind = request.kind
    df = None

    if request.dataset_version_id:
        df = _load_dataset(request.dataset_version_id, user.id)
        if df is None:
            raise HTTPException(status_code=404, detail="Dataset version not found")

    if kind == "regression":
        if df is not None:
            return _compute_regression(df, rng)
        x = rng.normal(size=60)
        z = rng.normal(size=60)
        y = 0.6 * x + 0.3 * z + rng.normal(scale=0.2, size=60)
        return {
            "points": [{"x": float(x[i]), "y": float(y[i]), "z": float(z[i])} for i in range(60)],
            "coefficients": {"x": 0.6, "z": 0.3},
        }

    if kind == "logistic":
        if df is not None:
            return _compute_logistic(df, rng)
        pts = []
        for i in range(80):
            cls = 0 if i < 40 else 1
            cx = -0.6 if cls == 0 else 0.6
            cy = -0.3 if cls == 0 else 0.3
            pts.append({
                "x": float(cx + rng.normal(scale=0.3)),
                "y": float(cy + rng.normal(scale=0.3)),
                "class": cls,
            })
        return {"points": pts, "boundary": {"slope": -1.2, "intercept": 0.0}}

    if kind == "kmeans":
        if df is not None:
            return _compute_kmeans(df, rng)
        centers = [(-0.6, 0.4), (0.5, -0.3), (-0.2, -0.6), (0.4, 0.5)]
        points = []
        for ci, (cx, cy) in enumerate(centers):
            for _ in range(25):
                points.append({
                    "x": float(cx + rng.normal(scale=0.2)),
                    "y": float(cy + rng.normal(scale=0.2)),
                    "cluster": ci,
                })
        return {"points": points, "centroids": [{"x": c[0], "y": c[1]} for c in centers]}

    if kind == "pca":
        if df is not None:
            return _compute_pca(df, rng)
        points = []
        for cls in range(3):
            cx = (cls - 1) * 0.6
            cy = (cls - 1) * 0.3
            cz = (cls - 1) * 0.2
            for _ in range(30):
                points.append({
                    "x": float(cx + rng.normal(scale=0.25)),
                    "y": float(cy + rng.normal(scale=0.25)),
                    "z": float(cz + rng.normal(scale=0.25)),
                    "class": cls,
                })
        return {"points": points, "explained_variance": [0.45, 0.32, 0.15]}

    if kind == "tree":
        if df is not None:
            return _compute_tree(df)
        return {
            "tree": {
                "condition": "age <= 35",
                "left": {
                    "condition": "income <= 50K",
                    "left": {"class": 0, "samples": 45},
                    "right": {"class": 1, "samples": 32},
                },
                "right": {
                    "condition": "score <= 75",
                    "left": {"class": 0, "samples": 28},
                    "right": {"class": 1, "samples": 95},
                },
            }
        }

    return {"error": "Unknown visualization kind"}


def _load_dataset(version_id: str, user_id: str) -> pl.DataFrame | None:
    supabase = get_service_client()
    version = (
        supabase.table("dataset_versions")
        .select("id, file_path, file_type, user_id")
        .eq("id", version_id)
        .single()
        .execute()
    )
    if not version.data or version.data["user_id"] != user_id:
        return None

    settings = get_settings()
    file_path = version.data["file_path"]
    file_type = version.data["file_type"]
    file_bytes = supabase.storage.from_(settings.supabase_datasets_bucket).download(file_path)

    buffer = io.BytesIO(file_bytes)
    file_type = (file_type or "").lower()
    if "/" in file_type:
        file_type = file_type.split("/")[-1]
    if file_type in ["csv", "txt"]:
        return pl.read_csv(buffer)
    if file_type in ["tsv"]:
        return pl.read_csv(buffer, separator="\t")
    if file_type in ["json", "ndjson"]:
        return pl.read_json(buffer)
    if file_type in ["parquet"]:
        return pl.read_parquet(buffer)
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")


def _numeric_columns(df: pl.DataFrame) -> list[str]:
    numeric = []
    for col in df.columns:
        if df[col].dtype in [pl.Float64, pl.Float32, pl.Int64, pl.Int32, pl.Int16, pl.Int8]:
            numeric.append(col)
    return numeric


def _target_column(df: pl.DataFrame) -> str | None:
    lowered = [c.lower() for c in df.columns]
    for candidate in ["target", "label", "class", "survived", "species"]:
        if candidate in lowered:
            return df.columns[lowered.index(candidate)]
    for col in df.columns:
        if df[col].dtype in [pl.Utf8, pl.Boolean]:
            return col
    return None


def _compute_regression(df: pl.DataFrame, rng: np.random.Generator):
    numeric = _numeric_columns(df)
    if len(numeric) < 2:
        return {"points": []}
    sample = df.select(numeric).drop_nulls().sample(n=min(200, df.height), seed=42)
    x = sample[numeric[0]].to_numpy()
    z = sample[numeric[1]].to_numpy()
    y = sample[numeric[2]].to_numpy() if len(numeric) > 2 else (0.5 * x + 0.3 * z)
    A = np.vstack([x, z, np.ones_like(x)]).T
    coeffs, *_ = np.linalg.lstsq(A, y, rcond=None)
    return {
        "points": [{"x": float(x[i]), "y": float(y[i]), "z": float(z[i])} for i in range(len(x))],
        "coefficients": {"x": float(coeffs[0]), "z": float(coeffs[1])},
    }


def _compute_logistic(df: pl.DataFrame, rng: np.random.Generator):
    target = _target_column(df)
    numeric = _numeric_columns(df)
    if not target or len(numeric) < 2:
        return {"points": []}
    sample = df.select([target, numeric[0], numeric[1]]).drop_nulls().sample(n=min(200, df.height), seed=42)
    classes = sample[target].unique().to_list()
    if len(classes) < 2:
        return {"points": []}
    mapping = {cls: i for i, cls in enumerate(classes[:2])}
    points = [
        {
            "x": float(row[numeric[0]]),
            "y": float(row[numeric[1]]),
            "class": int(mapping.get(row[target], 0)),
        }
        for row in sample.to_dicts()
        if row[target] in mapping
    ]
    return {"points": points}


def _compute_kmeans(df: pl.DataFrame, rng: np.random.Generator):
    numeric = _numeric_columns(df)
    if len(numeric) < 2:
        return {"points": []}
    sample = df.select(numeric[:2]).drop_nulls().sample(n=min(250, df.height), seed=42)
    data = sample.to_numpy()
    k = min(4, len(data)) if len(data) > 0 else 0
    centroids = data[rng.choice(len(data), size=k, replace=False)] if k else np.array([])
    for _ in range(6):
        if k == 0:
            break
        distances = ((data[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
        labels = distances.argmin(axis=1)
        for i in range(k):
            if (labels == i).any():
                centroids[i] = data[labels == i].mean(axis=0)
    points = [
        {"x": float(data[i][0]), "y": float(data[i][1]), "cluster": int(labels[i])}
        for i in range(len(data))
    ]
    return {
        "points": points,
        "centroids": [{"x": float(c[0]), "y": float(c[1])} for c in centroids],
    }


def _compute_pca(df: pl.DataFrame, rng: np.random.Generator):
    numeric = _numeric_columns(df)
    if len(numeric) < 3:
        return {"points": []}
    sample = df.select(numeric[:3]).drop_nulls().sample(n=min(200, df.height), seed=42)
    data = sample.to_numpy()
    data = data - data.mean(axis=0)
    u, s, vt = np.linalg.svd(data, full_matrices=False)
    components = data @ vt.T
    explained = (s ** 2) / (s ** 2).sum() if s.size else np.array([])
    points = [
        {
            "x": float(components[i, 0]),
            "y": float(components[i, 1]),
            "z": float(components[i, 2]) if components.shape[1] > 2 else 0.0,
            "class": 0,
        }
        for i in range(len(components))
    ]
    return {
        "points": points,
        "explained_variance": [float(v) for v in explained[:3]],
    }


def _compute_tree(df: pl.DataFrame):
    target = _target_column(df)
    numeric = _numeric_columns(df)
    if not target or not numeric:
        return {"tree": None}
    sample = df.select([target, numeric[0]]).drop_nulls()
    threshold = float(sample[numeric[0]].quantile(0.5))
    left = sample.filter(pl.col(numeric[0]) <= threshold)
    right = sample.filter(pl.col(numeric[0]) > threshold)
    left_class = left[target].mode()[0] if left.height else "N/A"
    right_class = right[target].mode()[0] if right.height else "N/A"
    return {
        "tree": {
            "condition": f"{numeric[0]} <= {threshold:.2f}",
            "left": {"class": str(left_class), "samples": left.height},
            "right": {"class": str(right_class), "samples": right.height},
        }
    }


@router.get("/visuals/sections/{version_id}")
def get_visual_section(version_id: str, section: str | None = Query(default=None), user=Depends(get_current_user)):
    supabase = get_service_client()
    result = (
        supabase.table("dataset_profiles")
        .select("charts")
        .eq("dataset_version_id", version_id)
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {"charts": []}

    charts = result.data[0].get("charts", [])
    if section:
        charts = [chart for chart in charts if chart.get("section") == section]
    return {"charts": charts}
