from typing import Any, Tuple
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

try:
    from lightgbm import LGBMClassifier
except Exception:  # pragma: no cover
    LGBMClassifier = None

try:
    import torch
    from torch import nn
    from torch.utils.data import DataLoader, TensorDataset
except Exception:  # pragma: no cover
    torch = None
    nn = None


class TorchTabularClassifier:
    def __init__(
        self,
        input_dim: int,
        num_classes: int,
        hidden_layers: list[int] | None = None,
        lr: float = 1e-3,
        epochs: int = 20,
        batch_size: int = 128,
    ):
        if torch is None:
            raise RuntimeError("PyTorch is not available")
        hidden_layers = hidden_layers or [128, 64]
        layers: list[nn.Module] = []
        last_dim = input_dim
        for size in hidden_layers:
            layers.append(nn.Linear(last_dim, size))
            layers.append(nn.ReLU())
            last_dim = size
        layers.append(nn.Linear(last_dim, num_classes))
        self.model = nn.Sequential(*layers)
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size
        self.num_classes = num_classes

    def fit(self, X: np.ndarray, y: np.ndarray):
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.long)
        dataset = TensorDataset(X_tensor, y_tensor)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        optimizer = torch.optim.Adam(self.model.parameters(), lr=self.lr)
        criterion = nn.CrossEntropyLoss()

        self.model.train()
        for _ in range(self.epochs):
            for batch_X, batch_y in loader:
                optimizer.zero_grad()
                logits = self.model(batch_X)
                loss = criterion(logits, batch_y)
                loss.backward()
                optimizer.step()
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        X_tensor = torch.tensor(X, dtype=torch.float32)
        with torch.no_grad():
            logits = self.model(X_tensor)
            probs = torch.softmax(logits, dim=1)
        return probs.cpu().numpy()

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


def create_classifier(
    algorithm: str,
    params: dict[str, Any],
    input_dim: int,
    num_classes: int,
    use_pytorch: bool,
) -> Tuple[Any, str]:
    algo = algorithm.lower()
    if use_pytorch or algo in {"neural", "pytorch", "pytorch_mlp", "mlp"}:
        model = TorchTabularClassifier(
            input_dim=input_dim,
            num_classes=num_classes,
            hidden_layers=params.get("hidden_layers"),
            lr=params.get("lr", 1e-3),
            epochs=params.get("epochs", 20),
            batch_size=params.get("batch_size", 128),
        )
        return model, "pytorch"

    if algo in {"random_forest", "rf"}:
        model = RandomForestClassifier(
            n_estimators=params.get("n_estimators", 200),
            max_depth=params.get("max_depth"),
            random_state=params.get("random_state", 42),
        )
        return model, "sklearn"

    if algo in {"logistic", "logreg", "logistic_regression"}:
        model = LogisticRegression(
            max_iter=params.get("max_iter", 500),
            solver=params.get("solver", "lbfgs"),
        )
        return model, "sklearn"

    if algo in {"lightgbm", "lgbm", "auto"}:
        if LGBMClassifier is None:
            raise RuntimeError("LightGBM is not installed")
        model = LGBMClassifier(
            n_estimators=params.get("n_estimators", 300),
            learning_rate=params.get("learning_rate", 0.1),
            max_depth=params.get("max_depth", -1),
            num_leaves=params.get("num_leaves", 31),
            subsample=params.get("subsample", 1.0),
            colsample_bytree=params.get("colsample_bytree", 1.0),
            random_state=params.get("random_state", 42),
        )
        return model, "lightgbm"

    raise ValueError(f"Unsupported classification algorithm: {algorithm}")
