from typing import Any, Dict, List
import io

import joblib
import numpy as np
import pandas as pd

from app.config import get_settings
from app.services.supabase_client import get_supabase_client
from app.utils.preprocessing import align_features


def load_artifact(model_id: str) -> Dict[str, Any]:
    settings = get_settings()
    supabase = get_supabase_client()

    storage_path = f"{model_id}/model.joblib"
    file_bytes = supabase.storage.from_(settings.supabase_models_bucket).download(storage_path)
    artifact = joblib.load(io.BytesIO(file_bytes))
    return artifact


def predict(
    model_id: str,
    rows: List[Dict[str, Any]],
    return_probabilities: bool = False,
) -> Dict[str, Any]:
    if not rows:
        raise ValueError("No input rows provided")

    artifact = load_artifact(model_id)
    model = artifact.get("model")
    preprocessor = artifact.get("preprocessor")
    framework = artifact.get("framework")
    label_encoder = artifact.get("label_encoder")
    feature_columns = artifact.get("feature_columns")
    model_type = artifact.get("model_type")

    df = pd.DataFrame(rows)
    if feature_columns:
        df = align_features(df, feature_columns)

    X_processed = preprocessor.transform(df)
    X_use = _ensure_dense(X_processed) if framework == "pytorch" else X_processed

    if model_type == "clustering" and not hasattr(model, "predict"):
        raise ValueError("Clustering model does not support prediction")

    predictions = model.predict(X_use)
    if label_encoder is not None:
        predictions = label_encoder.inverse_transform(predictions)

    response: Dict[str, Any] = {"predictions": predictions.tolist()}

    if return_probabilities and hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(X_use)
            response["probabilities"] = probs.tolist()
        except Exception:
            response["probabilities"] = None

    return response


def _ensure_dense(matrix):
    if hasattr(matrix, "toarray"):
        return matrix.toarray()
    return matrix
