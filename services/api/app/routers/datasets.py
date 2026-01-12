import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.middleware.auth import get_current_user, require_auth, AuthenticatedUser
from app.config import settings
from app.services.supabase import supabase_service
from app.services.file_handler import infer_file_type


router = APIRouter()


def _assert_dataset_access(dataset: dict, user: AuthenticatedUser | None):
    project = dataset.get("project") or {}
    if project.get("is_demo"):
        return
    if not user or project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _map_version_for_store(version: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": version.get("id"),
        "row_count_est": version.get("row_count"),
        "column_count_est": version.get("column_count"),
        "created_at": version.get("created_at"),
    }


def _map_column_type(raw_type: str | None) -> str:
    if not raw_type:
        return "text"
    lowered = raw_type.lower()
    if lowered in {"int", "integer", "float", "double", "number", "numeric"}:
        return "numeric"
    if lowered in {"bool", "boolean"}:
        return "boolean"
    if lowered in {"date", "datetime", "timestamp"}:
        return "datetime"
    return "text"


def _build_profile_payload(profile: dict | None, version: dict, dataset: dict) -> dict | None:
    if not profile:
        return None

    schema_info = profile.get("schema_info") or []
    columns = [
        {
            "name": col.get("name"),
            "inferred_type": _map_column_type(col.get("type") or col.get("inferred_type")),
        }
        for col in schema_info
        if isinstance(col, dict)
    ]

    stats = profile.get("statistics") or {}
    row_count = version.get("row_count") or stats.get("row_count") or 0
    column_count = version.get("column_count") or stats.get("column_count") or len(columns)
    file_size_bytes = version.get("file_size_bytes") or 0

    missing_values = profile.get("missing_values") or {}
    total_missing = missing_values.get("total_missing")

    return {
        "profile_json": {
            "dataset": {
                "name": dataset.get("name") or "Dataset",
                "version": version.get("version_number") or 1,
                "status": version.get("status") or "ready",
                "uploadedAt": version.get("created_at"),
            },
            "schema": {"columns": columns},
            "stats": {
                "row_count": row_count,
                "column_count": column_count,
                "memory_est_mb": round(file_size_bytes / (1024 * 1024), 4) if file_size_bytes else 0,
                "duplicate_rows": stats.get("duplicate_rows", 0),
            },
            "missing": {"total_missing": total_missing or 0},
            "warnings": profile.get("warnings") or [],
        },
        "sample_preview_json": profile.get("sample_data") or [],
    }


@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    result = await supabase_service.get_dataset(dataset_id)
    dataset = result.data
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    _assert_dataset_access(dataset, user)
    return {"dataset": dataset}


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    user: AuthenticatedUser = Depends(require_auth),
):
    result = await supabase_service.get_dataset(dataset_id)
    dataset = result.data
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    project = dataset.get("project") or {}
    if project.get("is_demo"):
        raise HTTPException(status_code=400, detail="Cannot delete demo dataset")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await supabase_service.client.table("datasets").delete().eq("id", dataset_id).execute()
    return {"success": True}


@router.get("/{dataset_id}/versions")
async def list_versions(
    dataset_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    result = await supabase_service.get_dataset(dataset_id)
    dataset = result.data
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    _assert_dataset_access(dataset, user)
    versions = dataset.get("dataset_versions") or []
    versions_sorted = sorted(versions, key=lambda item: item.get("created_at") or "")
    mapped = [_map_version_for_store(version) for version in versions_sorted]
    return {"versions": mapped}


@router.post("/{dataset_id}/upload")
async def upload_dataset(
    dataset_id: str,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(require_auth),
):
    dataset_result = await supabase_service.get_dataset(dataset_id)
    dataset = dataset_result.data
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    project = dataset.get("project") or {}
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    file_content = await file.read()
    file_size = len(file_content)
    detected_type = infer_file_type(file.filename, file.content_type)
    if not detected_type:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    storage_path = f"{user.user_id}/{dataset_id}/{uuid.uuid4()}/{file.filename}"

    supabase_service.upload_file(
        bucket=settings.supabase_datasets_bucket,
        path=storage_path,
        file_data=file_content,
        content_type=file.content_type or "application/octet-stream",
    )

    supabase_service.client.table("datasets").update({
        "file_type": detected_type,
        "original_filename": file.filename,
    }).eq("id", dataset_id).execute()

    version_result = await supabase_service.create_dataset_version(
        dataset_id=dataset_id,
        storage_path=storage_path,
        file_size_bytes=file_size,
        status="uploaded",
    )
    if not version_result.data:
        raise HTTPException(status_code=400, detail="Failed to create dataset version")

    version_id = version_result.data[0]["id"]

    job_result = await supabase_service.create_job(
        user_id=user.user_id,
        job_type="profile",
        payload={"version_id": version_id, "storage_path": storage_path},
    )

    await supabase_service.update_dataset_version(version_id, status="profiling")

    job_id = job_result.data[0]["id"] if job_result.data else None
    return {"dataset_version_id": version_id, "job_id": job_id}


@router.get("/versions/{version_id}/profile")
async def get_version_profile(
    version_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    version_result = await supabase_service.get_dataset_version(version_id)
    version = version_result.data
    if not version:
        return {"profile": None}

    dataset = version.get("dataset") or {}
    project = dataset.get("project") or {}
    if not project.get("is_demo"):
        if not user or project.get("user_id") != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    profile_result = await supabase_service.get_profile(version_id)
    profile = profile_result.data
    payload = _build_profile_payload(profile, version, dataset)
    return {"profile": payload}
