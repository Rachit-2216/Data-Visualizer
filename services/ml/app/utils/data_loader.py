import io
from typing import Any, Tuple
import pandas as pd

from app.config import get_settings
from app.services.supabase_client import get_supabase_client


def load_dataset_version(version_id: str) -> Tuple[pd.DataFrame, dict[str, Any]]:
    settings = get_settings()
    supabase = get_supabase_client()

    result = (
        supabase.table("dataset_versions")
        .select("*, dataset:datasets(*)")
        .eq("id", version_id)
        .single()
        .execute()
    )
    version = result.data
    if not version:
        raise ValueError("Dataset version not found")

    dataset = version.get("dataset") or {}
    storage_path = version.get("storage_path")
    if not storage_path:
        raise ValueError("Dataset version missing storage path")

    file_type = (dataset.get("file_type") or "").lower()
    file_bytes = supabase.storage.from_(settings.supabase_datasets_bucket).download(storage_path)
    df = _read_dataset(file_bytes, file_type, storage_path)

    return df, {
        "dataset_id": dataset.get("id"),
        "project_id": dataset.get("project_id"),
        "dataset_name": dataset.get("name") or "Dataset",
        "file_type": file_type,
        "storage_path": storage_path,
        "version_number": version.get("version_number"),
        "version_id": version.get("id"),
        "created_at": version.get("created_at"),
    }


def _read_dataset(file_bytes: bytes, file_type: str, storage_path: str) -> pd.DataFrame:
    buffer = io.BytesIO(file_bytes)
    file_type = _normalize_file_type(file_type, storage_path)

    if file_type in ["csv", "txt"]:
        return pd.read_csv(buffer)
    if file_type == "tsv":
        return pd.read_csv(buffer, sep="	")
    if file_type in ["json", "ndjson"]:
        try:
            return pd.read_json(buffer, lines=True)
        except ValueError:
            buffer.seek(0)
            return pd.read_json(buffer)
    if file_type == "parquet":
        return pd.read_parquet(buffer)
    if file_type in ["xlsx", "xls"]:
        return pd.read_excel(buffer)

    raise ValueError(f"Unsupported file type: {file_type}")


def _normalize_file_type(file_type: str, storage_path: str) -> str:
    cleaned = file_type
    if "/" in cleaned:
        cleaned = cleaned.split("/")[-1]
    if not cleaned and "." in storage_path:
        cleaned = storage_path.rsplit(".", 1)[-1].lower()
    return cleaned
