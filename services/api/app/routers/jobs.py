from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import require_auth, AuthenticatedUser
from app.services.supabase import supabase_service


router = APIRouter()


def _map_job_status(status_value: str | None) -> str:
    if not status_value:
        return "queued"
    if status_value == "completed":
        return "done"
    return status_value


@router.get("/{job_id}")
async def get_job(job_id: str, user: AuthenticatedUser = Depends(require_auth)):
    result = await supabase_service.get_job(job_id)
    job = result.data
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("user_id") and job.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    job["status"] = _map_job_status(job.get("status"))
    return {"job": job}
