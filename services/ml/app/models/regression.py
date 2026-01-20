from typing import Any, Tuple
import numpy as np
from sklearn.linear_model import LinearRegression, ElasticNet
from sklearn.ensemble import RandomForestRegressor

try:
    from lightgbm import LGBMRegressor
except Exception:  # pragma: no cover
    LGBMRegressor = None

try:
    import torch
    from torch import nn
    from torch.utils.data import DataLoader, TensorDataset
except Exception:  # pragma: no cover
    torch = None
    nn = None


class TorchTabularRegressor:
    def __init__(
        self,
        input_dim: int,
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
        layers.append(nn.Linear(last_dim, 1))
        self.model = nn.Sequential(*layers)
        self.lr = lr
        self.epochs = epochs
        self.batch_size = batch_size

    def fit(self, X: np.ndarray, y: np.ndarray):
        X_tensor = torch.tensor(X, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32).view(-1, 1)
        dataset = TensorDataset(X_tensor, y_tensor)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        optimizer = torch.optim.Adam(self.model.parameters(), lr=self.lr)
        criterion = nn.MSELoss()

        self.model.train()
        for _ in range(self.epochs):
            for batch_X, batch_y in loader:
                optimizer.zero_grad()
                preds = self.model(batch_X)
                loss = criterion(preds, batch_y)
                loss.backward()
                optimizer.step()
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        self.model.eval()
        X_tensor = torch.tensor(X, dtype=torch.float32)
        with torch.no_grad():
            preds = self.model(X_tensor)
        return preds.cpu().numpy().reshape(-1)


def create_regressor(
    algorithm: str,
    params: dict[str, Any],
    input_dim: int,
    use_pytorch: bool,
) -> Tuple[Any, str]:
    algo = algorithm.lower()
    if use_pytorch or algo in {"neural", "pytorch", "pytorch_mlp", "mlp"}:
        model = TorchTabularRegressor(
            input_dim=input_dim,
            hidden_layers=params.get("hidden_layers"),
            lr=params.get("lr", 1e-3),
            epochs=params.get("epochs", 20),
            batch_size=params.get("batch_size", 128),
        )
        return model, "pytorch"

    if algo in {"random_forest", "rf"}:
        model = RandomForestRegressor(
            n_estimators=params.get("n_estimators", 300),
            max_depth=params.get("max_depth"),
            random_state=params.get("random_state", 42),
        )
        return model, "sklearn"

    if algo in {"linear", "linear_regression"}:
        model = LinearRegression()
        return model, "sklearn"

    if algo in {"elasticnet", "elastic_net"}:
        model = ElasticNet(
            alpha=params.get("alpha", 1.0),
            l1_ratio=params.get("l1_ratio", 0.5),
            random_state=params.get("random_state", 42),
        )
        return model, "sklearn"

    if algo in {"lightgbm", "lgbm", "auto"}:
        if LGBMRegressor is None:
            raise RuntimeError("LightGBM is not installed")
        model = LGBMRegressor(
            n_estimators=params.get("n_estimators", 400),
            learning_rate=params.get("learning_rate", 0.05),
            max_depth=params.get("max_depth", -1),
            num_leaves=params.get("num_leaves", 31),
            subsample=params.get("subsample", 1.0),
            colsample_bytree=params.get("colsample_bytree", 1.0),
            random_state=params.get("random_state", 42),
        )
        return model, "lightgbm"

    raise ValueError(f"Unsupported regression algorithm: {algorithm}")
