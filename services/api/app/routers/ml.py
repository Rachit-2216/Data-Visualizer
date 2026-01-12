from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import require_auth, AuthenticatedUser
from app.models.schemas import MLModelCreate
from app.services.supabase import supabase_service


router = APIRouter()


@router.get("")
async def list_models(
    project_id: str,
    user: AuthenticatedUser = Depends(require_auth),
):
    project_result = await supabase_service.get_project(project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    result = await supabase_service.get_models(project_id)
    return {"models": result.data or []}


@router.post("")
async def create_model(
    payload: MLModelCreate,
    user: AuthenticatedUser = Depends(require_auth),
):
    project_result = await supabase_service.get_project(payload.project_id)
    project = project_result.data
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await supabase_service.create_model(
        project_id=payload.project_id,
        dataset_version_id=payload.dataset_version_id,
        name=payload.name,
        model_type=payload.model_type,
        algorithm=payload.algorithm,
        target_column=payload.target_column,
        feature_columns=payload.feature_columns,
        hyperparameters=payload.hyperparameters,
        status="draft",
    )
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create model")
    return {"model": result.data[0]}


@router.get("/{model_id}")
async def get_model(model_id: str, user: AuthenticatedUser = Depends(require_auth)):
    result = await supabase_service.get_model(model_id)
    model = result.data
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    project_result = await supabase_service.get_project(model["project_id"])
    project = project_result.data
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return {"model": model}


@router.patch("/{model_id}")
async def update_model(model_id: str, payload: dict, user: AuthenticatedUser = Depends(require_auth)):
    result = await supabase_service.get_model(model_id)
    model = result.data
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    project_result = await supabase_service.get_project(model["project_id"])
    project = project_result.data
    if project.get("user_id") != user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    updated = await supabase_service.update_model(model_id, **payload)
    return {"model": updated.data[0] if updated.data else model}
