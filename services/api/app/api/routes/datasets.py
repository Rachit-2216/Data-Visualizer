import mimetypes
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.services.supabase_client import get_service_client
from app.services.storage import upload_dataset_file, build_dataset_path

router = APIRouter()


class DatasetCreateRequest(BaseModel):
    name: str
    description: str | None = None


@router.get("/projects/{project_id}/datasets")
def list_datasets(project_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = supabase.table("datasets").select("*").eq("project_id", project_id).eq("user_id", user.id).execute()
    return {"datasets": result.data or []}


@router.post("/projects/{project_id}/datasets")
def create_dataset(project_id: str, request: DatasetCreateRequest, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = supabase.table("datasets").insert({
        "project_id": project_id,
        "user_id": user.id,
        "name": request.name,
        "description": request.description,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create dataset")
    return {"dataset": result.data[0]}


@router.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    supabase.table("datasets").delete().eq("id", dataset_id).eq("user_id", user.id).execute()
    return {"success": True}


@router.post("/datasets/{dataset_id}/upload")
async def upload_dataset(dataset_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    supabase = get_service_client()
    dataset = (
        supabase.table("datasets")
        .select("id")
        .eq("id", dataset_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    if not dataset.data:
        raise HTTPException(status_code=404, detail="Dataset not found")

    contents = await file.read()
    file_size = len(contents)
    suffix = Path(file.filename).suffix.lower().lstrip(".")
    file_type = suffix or (file.content_type or "application/octet-stream")
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"

    filename = f"{uuid4().hex}.{suffix or 'bin'}"
    file_path = build_dataset_path(user.id, dataset_id, filename)
    upload_dataset_file(file_path, contents, content_type)

    rpc = supabase.rpc(
        "create_dataset_version_and_enqueue",
        {
            "p_dataset_id": dataset_id,
            "p_user_id": user.id,
            "p_file_path": file_path,
            "p_file_type": file_type,
            "p_file_size_bytes": file_size,
        },
    ).execute()

    if not rpc.data:
        raise HTTPException(status_code=400, detail="Failed to enqueue profiling job")

    return {
        "dataset_version_id": rpc.data[0]["version_id"],
        "job_id": rpc.data[0]["job_id"],
        "file_path": file_path,
        "file_type": file_type,
        "file_size_bytes": file_size,
    }


@router.get("/datasets/{dataset_id}/versions")
def list_versions(dataset_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = supabase.table("dataset_versions").select("*").eq("dataset_id", dataset_id).eq("user_id", user.id).execute()
    return {"versions": result.data or []}


@router.get("/datasets/versions/{version_id}")
def get_version(version_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = (
        supabase.table("dataset_versions")
        .select("*")
        .eq("id", version_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    return {"version": result.data}


@router.get("/datasets/versions/{version_id}/profile")
def get_profile(version_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = (
        supabase.table("dataset_profiles")
        .select("*")
        .eq("dataset_version_id", version_id)
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return {"profile": result.data[0] if result.data else None}


@router.get("/jobs/{job_id}")
def get_job(job_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = (
        supabase.table("jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    return {"job": result.data}
