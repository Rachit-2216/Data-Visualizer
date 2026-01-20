from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.core.profiler import DataProfiler
from app.services.supabase_client import get_supabase_client

router = APIRouter()


class ProfileRequest(BaseModel):
    job_id: str
    dataset_version_id: str
    signed_url: str


class ProfileResponse(BaseModel):
    success: bool
    message: str
    profile_id: Optional[str] = None


@router.post("/profile", response_model=ProfileResponse)
async def create_profile(request: ProfileRequest):
    """
    Process a profiling job.
    This endpoint is called by the job processor or can be triggered manually.
    """
    try:
        supabase = get_supabase_client()

        # Update job status to running
        supabase.table("jobs").update({
            "status": "running",
            "progress": 10,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", request.job_id).execute()

        # Download the file
        # For now, we'll use a placeholder since we need the actual file
        # In production, download from the signed_url

        # Create profiler and run
        profiler = DataProfiler()

        # Update progress
        supabase.table("jobs").update({"progress": 50}).eq("id", request.job_id).execute()

        # Get dataset version info
        version_result = (
            supabase.table("dataset_versions")
            .select("*, dataset:datasets(*)")
            .eq("id", request.dataset_version_id)
            .single()
            .execute()
        )

        if not version_result.data:
            raise HTTPException(status_code=404, detail="Dataset version not found")

        version = version_result.data

        # For demo, create a mock profile
        profile_data = profiler.create_demo_profile()

        # Insert profile
        schema_info = profile_data.get("schema", {}).get("columns", [])
        statistics = profile_data.get("stats", {})
        profile_result = supabase.table("dataset_profiles").upsert({
            "version_id": request.dataset_version_id,
            "schema_info": schema_info,
            "statistics": statistics,
            "correlations": profile_data.get("correlations"),
            "missing_values": profile_data.get("missing"),
            "warnings": profile_data.get("warnings", []),
            "sample_data": [],
            "computed_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="version_id").execute()

        # Update dataset version status
        supabase.table("dataset_versions").update({
            "status": "ready",
            "row_count": statistics.get("row_count"),
            "column_count": statistics.get("column_count"),
            "error_message": None,
        }).eq("id", request.dataset_version_id).execute()

        # Complete the job
        supabase.table("jobs").update({
            "status": "completed",
            "progress": 100,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", request.job_id).execute()

        return ProfileResponse(
            success=True,
            message="Profile created successfully",
            profile_id=profile_result.data[0]["id"] if profile_result.data else None
        )

    except Exception as e:
        # Mark job as failed
        supabase = get_supabase_client()
        supabase.table("jobs").update({
            "status": "failed",
            "error_message": str(e),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", request.job_id).execute()

        supabase.table("dataset_versions").update({
            "status": "error",
            "error_message": str(e),
        }).eq("id", request.dataset_version_id).execute()

        raise HTTPException(status_code=500, detail=str(e))
