from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import io
import uuid
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from app.config import get_settings
from app.services.supabase_client import get_supabase_client
from app.utils.data_loader import load_dataset_version
from app.utils.preprocessing import split_features, build_preprocessor
from app.utils.evaluation import classification_metrics, regression_metrics, clustering_metrics
from app.models.classification import create_classifier
from app.models.regression import create_regressor
from app.models.clustering import create_clusterer


@dataclass
class TrainRequest:
    dataset_version_id: str
    task_type: str
    target_column: Optional[str] = None
    algorithm: str = "auto"
    hyperparameters: Dict[str, Any] = field(default_factory=dict)
    feature_columns: Optional[List[str]] = None
    test_split: float = 0.2
    random_state: int = 42
    use_pytorch: Optional[bool] = None
    max_rows: Optional[int] = None
    model_id: Optional[str] = None


def should_use_pytorch(
    algorithm: str,
    use_pytorch: Optional[bool],
    row_count: int,
    feature_count: int,
) -> bool:
    settings = get_settings()
    algo = algorithm.lower()
    if use_pytorch is True:
        return True
    if algo in {"neural", "pytorch", "pytorch_mlp", "mlp"}:
        return True
    if algo == "auto" and (
        row_count >= settings.pytorch_min_rows
        or feature_count >= settings.pytorch_min_features
    ):
        return True
    return False


def train_model(request: TrainRequest) -> Dict[str, Any]:
    settings = get_settings()
    df, dataset_info = load_dataset_version(request.dataset_version_id)
    df = _sample_df(df, request.max_rows or settings.max_sample_size, request.random_state)

    task = request.task_type.lower()
    if task == "classification":
        return _train_classification(df, dataset_info, request)
    if task == "regression":
        return _train_regression(df, dataset_info, request)
    if task == "clustering":
        return _train_clustering(df, dataset_info, request)

    raise ValueError(f"Unsupported task type: {request.task_type}")


def _train_classification(
    df: pd.DataFrame,
    dataset_info: Dict[str, Any],
    request: TrainRequest,
) -> Dict[str, Any]:
    if not request.target_column:
        raise ValueError("target_column is required for classification")

    df = df.dropna(subset=[request.target_column])
    features, target = split_features(df, request.target_column, request.feature_columns)
    if target is None or features.empty:
        raise ValueError("No training data available")

    preprocessor = build_preprocessor(features)
    X_processed = preprocessor.fit_transform(features)
    feature_count = int(X_processed.shape[1])

    label_encoder = None
    if target.dtype == object or str(target.dtype) == "category" or target.dtype == bool:
        label_encoder = LabelEncoder()
        y_values = label_encoder.fit_transform(target.astype(str))
    else:
        y_values = target.to_numpy()

    classes = np.unique(y_values)
    if len(classes) < 2:
        raise ValueError("Classification requires at least 2 classes")

    X_train, X_test, y_train, y_test = train_test_split(
        X_processed,
        y_values,
        test_size=request.test_split,
        random_state=request.random_state,
        stratify=y_values if len(classes) > 1 else None,
    )

    use_pytorch = should_use_pytorch(
        request.algorithm,
        request.use_pytorch,
        row_count=len(features),
        feature_count=feature_count,
    )

    model, framework = create_classifier(
        request.algorithm,
        request.hyperparameters,
        input_dim=int(X_train.shape[1]),
        num_classes=len(classes),
        use_pytorch=use_pytorch,
    )

    X_train_use = _prepare_matrix(X_train, framework, request.algorithm)
    X_test_use = _prepare_matrix(X_test, framework, request.algorithm)

    model.fit(X_train_use, y_train)
    y_pred = model.predict(X_test_use)

    y_proba = None
    if hasattr(model, "predict_proba"):
        try:
            y_proba = model.predict_proba(X_test_use)
        except Exception:
            y_proba = None

    metrics = classification_metrics(y_test, y_pred, y_proba)

    artifact = {
        "model_type": "classification",
        "framework": framework,
        "algorithm": request.algorithm,
        "model": model,
        "preprocessor": preprocessor,
        "label_encoder": label_encoder,
        "feature_columns": features.columns.tolist(),
        "target_column": request.target_column,
        "metrics": metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_info": dataset_info,
    }

    model_id = request.model_id or str(uuid.uuid4())
    storage_path = _save_artifact(artifact, model_id)

    return {
        "model_id": model_id,
        "storage_path": storage_path,
        "framework": framework,
        "algorithm": request.algorithm,
        "metrics": metrics,
        "rows_trained": int(len(features)),
        "feature_count": feature_count,
        "used_pytorch": framework == "pytorch",
    }


def _train_regression(
    df: pd.DataFrame,
    dataset_info: Dict[str, Any],
    request: TrainRequest,
) -> Dict[str, Any]:
    if not request.target_column:
        raise ValueError("target_column is required for regression")

    df = df.dropna(subset=[request.target_column])
    features, target = split_features(df, request.target_column, request.feature_columns)
    if target is None or features.empty:
        raise ValueError("No training data available")

    target_numeric = pd.to_numeric(target, errors="coerce")
    if target_numeric.isna().any():
        raise ValueError("Regression target must be numeric")

    preprocessor = build_preprocessor(features)
    X_processed = preprocessor.fit_transform(features)
    feature_count = int(X_processed.shape[1])

    X_train, X_test, y_train, y_test = train_test_split(
        X_processed,
        target_numeric.to_numpy(),
        test_size=request.test_split,
        random_state=request.random_state,
    )

    use_pytorch = should_use_pytorch(
        request.algorithm,
        request.use_pytorch,
        row_count=len(features),
        feature_count=feature_count,
    )

    model, framework = create_regressor(
        request.algorithm,
        request.hyperparameters,
        input_dim=int(X_train.shape[1]),
        use_pytorch=use_pytorch,
    )

    X_train_use = _prepare_matrix(X_train, framework, request.algorithm)
    X_test_use = _prepare_matrix(X_test, framework, request.algorithm)

    model.fit(X_train_use, y_train)
    y_pred = model.predict(X_test_use)

    metrics = regression_metrics(y_test, y_pred)

    artifact = {
        "model_type": "regression",
        "framework": framework,
        "algorithm": request.algorithm,
        "model": model,
        "preprocessor": preprocessor,
        "label_encoder": None,
        "feature_columns": features.columns.tolist(),
        "target_column": request.target_column,
        "metrics": metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_info": dataset_info,
    }

    model_id = request.model_id or str(uuid.uuid4())
    storage_path = _save_artifact(artifact, model_id)

    return {
        "model_id": model_id,
        "storage_path": storage_path,
        "framework": framework,
        "algorithm": request.algorithm,
        "metrics": metrics,
        "rows_trained": int(len(features)),
        "feature_count": feature_count,
        "used_pytorch": framework == "pytorch",
    }


def _train_clustering(
    df: pd.DataFrame,
    dataset_info: Dict[str, Any],
    request: TrainRequest,
) -> Dict[str, Any]:
    features, _ = split_features(df, None, request.feature_columns)
    if features.empty:
        raise ValueError("No clustering data available")

    preprocessor = build_preprocessor(features)
    X_processed = preprocessor.fit_transform(features)
    feature_count = int(X_processed.shape[1])

    model, framework = create_clusterer(request.algorithm, request.hyperparameters)

    X_train_use = _ensure_dense(X_processed)
    model.fit(X_train_use)

    if hasattr(model, "labels_"):
        labels = model.labels_
    elif hasattr(model, "predict"):
        labels = model.predict(X_train_use)
    else:
        labels = model.fit_predict(X_train_use)

    metrics = clustering_metrics(_sample_for_metrics(X_train_use), labels)

    artifact = {
        "model_type": "clustering",
        "framework": framework,
        "algorithm": request.algorithm,
        "model": model,
        "preprocessor": preprocessor,
        "label_encoder": None,
        "feature_columns": features.columns.tolist(),
        "target_column": None,
        "metrics": metrics,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_info": dataset_info,
    }

    model_id = request.model_id or str(uuid.uuid4())
    storage_path = _save_artifact(artifact, model_id)

    return {
        "model_id": model_id,
        "storage_path": storage_path,
        "framework": framework,
        "algorithm": request.algorithm,
        "metrics": metrics,
        "rows_trained": int(len(features)),
        "feature_count": feature_count,
        "used_pytorch": False,
    }


def _prepare_matrix(matrix, framework: str, algorithm: str):
    if framework == "pytorch":
        return _ensure_dense(matrix)
    algo = algorithm.lower()
    if algo in {
        "random_forest",
        "rf",
        "logistic",
        "logreg",
        "logistic_regression",
        "linear",
        "linear_regression",
        "elasticnet",
        "elastic_net",
    }:
        return _ensure_dense(matrix)
    return matrix


def _sample_df(df: pd.DataFrame, limit: Optional[int], random_state: int) -> pd.DataFrame:
    if limit and len(df) > limit:
        return df.sample(n=limit, random_state=random_state)
    return df


def _ensure_dense(matrix):
    if hasattr(matrix, "toarray"):
        return matrix.toarray()
    return matrix


def _sample_for_metrics(matrix, max_samples: int = 2000):
    if hasattr(matrix, "shape") and matrix.shape[0] > max_samples:
        indices = np.random.choice(matrix.shape[0], size=max_samples, replace=False)
        return matrix[indices]
    return matrix


def _save_artifact(artifact: Dict[str, Any], model_id: str) -> str:
    settings = get_settings()
    supabase = get_supabase_client()

    buffer = io.BytesIO()
    joblib.dump(artifact, buffer)
    buffer.seek(0)

    storage_path = f"{model_id}/model.joblib"
    supabase.storage.from_(settings.supabase_models_bucket).upload(
        storage_path,
        buffer.getvalue(),
        {"content-type": "application/octet-stream", "upsert": True},
    )
    return storage_path
