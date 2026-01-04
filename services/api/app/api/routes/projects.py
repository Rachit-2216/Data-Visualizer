from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.services.supabase_client import get_service_client

router = APIRouter()


class ProjectCreateRequest(BaseModel):
    name: str


@router.get("/projects")
def list_projects(user=Depends(get_current_user)):
    supabase = get_service_client()
    result = supabase.table("projects").select("*").eq("user_id", user.id).execute()
    return {"projects": result.data or []}


@router.post("/projects")
def create_project(request: ProjectCreateRequest, user=Depends(get_current_user)):
    supabase = get_service_client()
    result = supabase.table("projects").insert({
        "name": request.name,
        "user_id": user.id,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create project")
    return {"project": result.data[0]}


@router.delete("/projects/{project_id}")
def delete_project(project_id: str, user=Depends(get_current_user)):
    supabase = get_service_client()
    supabase.table("projects").delete().eq("id", project_id).eq("user_id", user.id).execute()
    return {"success": True}
