from datetime import datetime
from typing import Any, Optional, List

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    settings: Optional[dict[str, Any]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    settings: Optional[dict[str, Any]] = None


class ProjectResponse(BaseModel):
    id: str
    user_id: Optional[str]
    name: str
    description: Optional[str]
    is_demo: bool = False
    settings: dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    file_type: Optional[str] = Field(default="csv", pattern="^(csv|json|parquet|tsv|xlsx)$")
    original_filename: Optional[str] = None
    description: Optional[str] = None


class DatasetResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str]
    file_type: str
    original_filename: Optional[str]
    created_at: datetime
    updated_at: datetime
    dataset_versions: Optional[List[dict[str, Any]]] = []


class DatasetVersionResponse(BaseModel):
    id: str
    dataset_id: str
    version_number: int
    storage_path: str
    file_size_bytes: Optional[int]
    row_count: Optional[int]
    column_count: Optional[int]
    status: str
    error_message: Optional[str]
    created_at: datetime


class ProfileResponse(BaseModel):
    id: str
    version_id: str
    schema_info: List[dict[str, Any]]
    statistics: dict[str, Any]
    correlations: Optional[dict[str, Any]] = None
    missing_values: Optional[dict[str, Any]] = None
    warnings: List[dict[str, Any]] = []
    sample_data: Optional[List[dict[str, Any]]] = None
    computed_at: datetime


class ChatMessage(BaseModel):
    content: str = Field(..., min_length=1)
    dataset_version_id: Optional[str] = None


class ConversationCreate(BaseModel):
    project_id: str
    dataset_version_id: Optional[str] = None


class MLModelCreate(BaseModel):
    project_id: str
    dataset_version_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    model_type: str = Field(..., pattern="^(classification|regression|clustering)$")
    algorithm: str
    target_column: Optional[str] = None
    feature_columns: List[str] = []
    hyperparameters: dict[str, Any] = {}


class MLModelResponse(BaseModel):
    id: str
    project_id: str
    dataset_version_id: Optional[str]
    name: str
    model_type: str
    algorithm: str
    target_column: Optional[str]
    feature_columns: List[str]
    hyperparameters: dict[str, Any]
    metrics: Optional[dict[str, Any]] = None
    feature_importance: Optional[dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime


class VisualizationCreate(BaseModel):
    project_id: str
    dataset_version_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    chart_type: str
    vega_spec: dict[str, Any]
    description: Optional[str] = None


class VisualizationResponse(BaseModel):
    id: str
    project_id: str
    dataset_version_id: Optional[str]
    name: str
    description: Optional[str]
    chart_type: str
    vega_spec: dict[str, Any]
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime


class JobResponse(BaseModel):
    id: str
    user_id: Optional[str]
    job_type: str
    status: str
    progress: int
    payload: dict[str, Any]
    result: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
