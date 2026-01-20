from typing import Any, Dict
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    silhouette_score,
)


def classification_metrics(y_true, y_pred, y_proba=None) -> Dict[str, Any]:
    metrics = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, average="weighted", zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, average="weighted", zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
    }
    if y_proba is not None:
        try:
            if y_proba.ndim == 1 or y_proba.shape[1] == 2:
                metrics["roc_auc"] = float(roc_auc_score(y_true, y_proba[:, 1] if y_proba.ndim > 1 else y_proba))
        except Exception:
            pass
    return metrics


def regression_metrics(y_true, y_pred) -> Dict[str, Any]:
    rmse = mean_squared_error(y_true, y_pred, squared=False)
    return {
        "rmse": float(rmse),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "r2": float(r2_score(y_true, y_pred)),
    }


def clustering_metrics(X, labels) -> Dict[str, Any]:
    unique = np.unique(labels)
    if len(unique) <= 1:
        return {"silhouette": None}
    try:
        return {"silhouette": float(silhouette_score(X, labels))}
    except Exception:
        return {"silhouette": None}
