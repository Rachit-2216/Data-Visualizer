import logging
import os
from supabase import Client, create_client
from app.config import settings


logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        for key in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]:
            os.environ.pop(key, None)
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    # Projects
    async def get_projects(self, user_id: str | None = None):
        query = self.client.table("projects").select("*")
        if user_id:
            query = query.or_(f"user_id.eq.{user_id},is_demo.eq.true")
        else:
            query = query.eq("is_demo", True)
        return query.order("created_at", desc=True).execute()

    async def create_project(self, user_id: str, name: str, description: str | None = None):
        return self.client.table("projects").insert({
            "user_id": user_id,
            "name": name,
            "description": description,
        }).execute()

    async def get_project(self, project_id: str):
        return self.client.table("projects").select("*").eq("id", project_id).single().execute()

    async def update_project(self, project_id: str, **kwargs):
        return self.client.table("projects").update(kwargs).eq("id", project_id).execute()

    async def delete_project(self, project_id: str):
        return self.client.table("projects").delete().eq("id", project_id).execute()

    # Datasets
    async def get_datasets(self, project_id: str):
        return self.client.table("datasets").select(
            "*, dataset_versions(*)"
        ).eq("project_id", project_id).order("created_at", desc=True).execute()

    async def create_dataset(self, project_id: str, name: str, file_type: str, original_filename: str | None = None, description: str | None = None):
        return self.client.table("datasets").insert({
            "project_id": project_id,
            "name": name,
            "description": description,
            "file_type": file_type,
            "original_filename": original_filename,
        }).execute()

    async def get_dataset(self, dataset_id: str):
        return self.client.table("datasets").select(
            "*, dataset_versions(*), project:projects(*)"
        ).eq("id", dataset_id).single().execute()

    # Dataset Versions
    async def create_dataset_version(self, dataset_id: str, storage_path: str, **kwargs):
        existing = self.client.table("dataset_versions").select("version_number").eq(
            "dataset_id", dataset_id
        ).order("version_number", desc=True).limit(1).execute()

        next_version = 1
        if existing.data:
            next_version = existing.data[0]["version_number"] + 1

        return self.client.table("dataset_versions").insert({
            "dataset_id": dataset_id,
            "version_number": next_version,
            "storage_path": storage_path,
            **kwargs,
        }).execute()

    async def update_dataset_version(self, version_id: str, **kwargs):
        return self.client.table("dataset_versions").update(kwargs).eq("id", version_id).execute()

    async def get_dataset_version(self, version_id: str):
        return self.client.table("dataset_versions").select(
            "*, dataset:datasets(*, project:projects(*))"
        ).eq("id", version_id).single().execute()

    # Profiles
    async def get_profile(self, version_id: str):
        return self.client.table("dataset_profiles").select("*").eq("version_id", version_id).single().execute()

    async def create_profile(self, version_id: str, **kwargs):
        return self.client.table("dataset_profiles").insert({
            "version_id": version_id,
            **kwargs,
        }).execute()

    # Jobs
    async def create_job(self, user_id: str | None, job_type: str, payload: dict):
        return self.client.table("jobs").insert({
            "user_id": user_id,
            "job_type": job_type,
            "payload": payload,
        }).execute()

    async def get_job(self, job_id: str):
        return self.client.table("jobs").select("*").eq("id", job_id).single().execute()

    async def update_job(self, job_id: str, **kwargs):
        return self.client.table("jobs").update(kwargs).eq("id", job_id).execute()

    async def get_user_jobs(self, user_id: str):
        return self.client.table("jobs").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()

    # Chat
    async def create_conversation(self, user_id: str, project_id: str, dataset_version_id: str | None = None):
        return self.client.table("chat_conversations").insert({
            "user_id": user_id,
            "project_id": project_id,
            "dataset_version_id": dataset_version_id,
        }).execute()

    async def get_conversations(self, user_id: str):
        return self.client.table("chat_conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()

    async def get_conversation_messages(self, conversation_id: str):
        return self.client.table("chat_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()

    async def add_message(self, conversation_id: str, role: str, content: str, **kwargs):
        return self.client.table("chat_messages").insert({
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            **kwargs,
        }).execute()

    # ML Models
    async def get_models(self, project_id: str):
        return self.client.table("ml_models").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()

    async def create_model(self, project_id: str, **kwargs):
        return self.client.table("ml_models").insert({
            "project_id": project_id,
            **kwargs,
        }).execute()

    async def get_model(self, model_id: str):
        return self.client.table("ml_models").select("*").eq("id", model_id).single().execute()

    async def update_model(self, model_id: str, **kwargs):
        return self.client.table("ml_models").update(kwargs).eq("id", model_id).execute()

    # Saved Visualizations
    async def get_saved_visuals(self, project_id: str):
        return self.client.table("saved_visualizations").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()

    async def save_visualization(self, project_id: str, **kwargs):
        return self.client.table("saved_visualizations").insert({
            "project_id": project_id,
            **kwargs,
        }).execute()

    # Storage
    def upload_file(self, bucket: str, path: str, file_data: bytes, content_type: str):
        return self.client.storage.from_(bucket).upload(path, file_data, {"content-type": content_type})

    def download_file(self, bucket: str, path: str):
        return self.client.storage.from_(bucket).download(path)

    def get_public_url(self, bucket: str, path: str):
        return self.client.storage.from_(bucket).get_public_url(path)


supabase_service = SupabaseService()
