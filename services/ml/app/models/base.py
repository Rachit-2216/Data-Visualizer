from typing import Protocol, Any
import numpy as np


class ModelProtocol(Protocol):
    def fit(self, X: np.ndarray, y: np.ndarray | None = None) -> Any:
        ...

    def predict(self, X: np.ndarray) -> np.ndarray:
        ...

    def predict_proba(self, X: np.ndarray) -> np.ndarray | None:
        ...
