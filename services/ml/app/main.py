from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.services.trainer import TrainRequest, train_model
from app.services.inference import predict


app = FastAPI(title="DataCanvas ML Service", version="1.0.0")


class TrainRequestModel(BaseModel):
    dataset_version_id: str
    task_type: Literal["classification", "regression", "clustering"]
    target_column: Optional[str] = None
    algorithm: str = "auto"
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    feature_columns: Optional[List[str]] = None
    test_split: float = 0.2
    random_state: int = 42
    use_pytorch: Optional[bool] = None
    max_rows: Optional[int] = None
    model_id: Optional[str] = None

    def to_internal(self) -> TrainRequest:
        return TrainRequest(**self.model_dump())


class PredictRequestModel(BaseModel):
    model_id: str
    rows: List[Dict[str, Any]]
    return_probabilities: bool = False


@app.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "healthy"}


@app.post("/train")
async def train_endpoint(payload: TrainRequestModel) -> Dict[str, Any]:
    try:
        return train_model(payload.to_internal())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/predict")
async def predict_endpoint(payload: PredictRequestModel) -> Dict[str, Any]:
    try:
        return predict(
            model_id=payload.model_id,
            rows=payload.rows,
            return_probabilities=payload.return_probabilities,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
