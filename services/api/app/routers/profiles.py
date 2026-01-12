from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import get_current_user, AuthenticatedUser
from app.services.supabase import supabase_service


router = APIRouter()


@router.get("/{version_id}")
async def get_profile(
    version_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    version_result = await supabase_service.get_dataset_version(version_id)
    version = version_result.data
    if not version:
        raise HTTPException(status_code=404, detail="Dataset version not found")

    project = (version.get("dataset") or {}).get("project") or {}
    if not project.get("is_demo"):
        if not user or project.get("user_id") != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    profile_result = await supabase_service.get_profile(version_id)
    profile = profile_result.data
    if not profile:
        return {"profile": None}
    return {"profile": profile}
