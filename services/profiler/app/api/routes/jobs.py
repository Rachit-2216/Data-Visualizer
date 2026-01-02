from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services.supabase_client import get_supabase_client

router = APIRouter()


class JobStatus(BaseModel):
    id: str
    job_type: str
    status: str
    progress: int
    error: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """Get the status of a specific job."""
    supabase = get_supabase_client()

    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatus(**result.data)


@router.get("/jobs", response_model=List[JobStatus])
async def list_pending_jobs():
    """List all pending jobs (for monitoring)."""
    supabase = get_supabase_client()

    result = supabase.table("jobs").select("*").in_(
        "status", ["queued", "running"]
    ).order("created_at").limit(50).execute()

    return [JobStatus(**job) for job in result.data]
