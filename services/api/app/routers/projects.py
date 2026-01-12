from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import get_current_user, require_auth, AuthenticatedUser
from app.models.schemas import ProjectCreate, ProjectUpdate, DatasetCreate
from app.services.supabase import supabase_service


router = APIRouter()


def _assert_project_access(project: dict, user: AuthenticatedUser | None):
    if project.get("is_demo"):
        return
    if not user or project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


@router.get("")
async def list_projects(user: AuthenticatedUser | None = Depends(get_current_user)):
    result = await supabase_service.get_projects(user.user_id if user else None)
    return {"projects": result.data or []}


@router.post("")
async def create_project(
    payload: ProjectCreate,
    user: AuthenticatedUser = Depends(require_auth),
):
    result = await supabase_service.create_project(
        user_id=user.user_id,
        name=payload.name,
        description=payload.description,
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create project")
    return {"project": result.data[0]}


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    result = await supabase_service.get_project(project_id)
    project = result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_project_access(project, user)
    return {"project": project}


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: AuthenticatedUser = Depends(require_auth),
):
    existing = await supabase_service.get_project(project_id)
    project = existing.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    update_data = payload.model_dump(exclude_unset=True)
    result = await supabase_service.update_project(project_id, **update_data)
    return {"project": result.data[0] if result.data else project}


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: AuthenticatedUser = Depends(require_auth),
):
    existing = await supabase_service.get_project(project_id)
    project = existing.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("is_demo"):
        raise HTTPException(status_code=400, detail="Cannot delete demo project")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await supabase_service.delete_project(project_id)
    return {"success": True}


@router.get("/{project_id}/datasets")
async def list_project_datasets(
    project_id: str,
    user: AuthenticatedUser | None = Depends(get_current_user),
):
    project_result = await supabase_service.get_project(project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_project_access(project, user)
    datasets = await supabase_service.get_datasets(project_id)
    return {"datasets": datasets.data or []}


@router.post("/{project_id}/datasets")
async def create_project_dataset(
    project_id: str,
    payload: DatasetCreate,
    user: AuthenticatedUser = Depends(require_auth),
):
    project_result = await supabase_service.get_project(project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await supabase_service.create_dataset(
        project_id=project_id,
        name=payload.name,
        file_type=payload.file_type or "csv",
        original_filename=payload.original_filename,
        description=payload.description,
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create dataset")
    return {"dataset": result.data[0]}
