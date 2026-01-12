import io
from typing import Optional

import numpy as np
import polars as pl
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.config import settings
from app.middleware.auth import get_current_user, require_auth, AuthenticatedUser
from app.models.schemas import VisualizationCreate
from app.services.supabase import supabase_service


router = APIRouter()


class VisualRequest(BaseModel):
    kind: str
    seed: int = 42
    dataset_version_id: Optional[str] = None


def _assert_project_access(project: dict, user: AuthenticatedUser | None):
    if project.get("is_demo"):
        return
    if not user or project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.post("/simulate")
async def simulate_visual(request: VisualRequest, user: AuthenticatedUser | None = Depends(get_current_user)):
    rng = np.random.default_rng(request.seed)
    kind = request.kind
    df = None

    if request.dataset_version_id:
        df = await _load_dataset(request.dataset_version_id, user)
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


@router.get("/sections/{version_id}")
async def get_visual_section(version_id: str, section: Optional[str] = Query(default=None)):
    _ = section
    return {"charts": []}


@router.get("/saved")
async def list_saved_visualizations(
    project_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    project_result = await supabase_service.get_project(project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_project_access(project, user)
    visuals = await supabase_service.get_saved_visuals(project_id)
    return {"visualizations": visuals.data or []}


@router.post("/save")
async def save_visualization(
    payload: VisualizationCreate,
    user: AuthenticatedUser = Depends(require_auth),
):
    project_result = await supabase_service.get_project(payload.project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("user_id") != user.user_id and not project.get("is_demo"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await supabase_service.save_visualization(
        project_id=payload.project_id,
        dataset_version_id=payload.dataset_version_id,
        name=payload.name,
        description=payload.description,
        chart_type=payload.chart_type,
        vega_spec=payload.vega_spec,
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to save visualization")
    return {"visualization": result.data[0]}


async def _load_dataset(version_id: str, user: AuthenticatedUser | None) -> pl.DataFrame | None:
    version_result = await supabase_service.get_dataset_version(version_id)
    version = version_result.data
    if not version:
        return None

    dataset = version.get("dataset") or {}
    project = dataset.get("project") or {}
    if not project.get("is_demo"):
        if not user or project.get("user_id") != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_path = version.get("storage_path")
    if not file_path:
        return None
    file_type = (dataset.get("file_type") or "").lower()
    file_bytes = supabase_service.download_file(settings.supabase_datasets_bucket, file_path)

    buffer = io.BytesIO(file_bytes)
    if "/" in file_type:
        file_type = file_type.split("/")[-1]
    if not file_type and "." in file_path:
        file_type = file_path.rsplit(".", 1)[-1].lower()
    if file_type in ["csv", "txt"]:
        return pl.read_csv(buffer)
    if file_type in ["tsv"]:
        return pl.read_csv(buffer, separator="\t")
    if file_type in ["json", "ndjson"]:
        return pl.read_json(buffer)
    if file_type in ["parquet"]:
        return pl.read_parquet(buffer)
    if file_type in ["xlsx", "xls"]:
        raise HTTPException(status_code=400, detail="XLSX parsing not supported in simulator")
    raise HTTPException(status_code=400, detail=f"Unsupported file type: {file_type}")


def _numeric_columns(df: pl.DataFrame) -> list[str]:
    numeric = []
    for col in df.columns:
        if df[col].dtype in [pl.Float64, pl.Float32, pl.Int64, pl.Int32, pl.Int16, pl.Int8]:
            numeric.append(col)
    return numeric


def _target_column(df: pl.DataFrame) -> Optional[str]:
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
    return {"points": points, "centroids": [{"x": float(c[0]), "y": float(c[1])} for c in centroids]}


def _compute_pca(df: pl.DataFrame, rng: np.random.Generator):
    numeric = _numeric_columns(df)
    if len(numeric) < 3:
        return {"points": []}
    sample = df.select(numeric[:3]).drop_nulls().sample(n=min(200, df.height), seed=42)
    data = sample.to_numpy()
    data = data - data.mean(axis=0)
    _, s, vt = np.linalg.svd(data, full_matrices=False)
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
    return {"points": points, "explained_variance": [float(v) for v in explained[:3]]}


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
