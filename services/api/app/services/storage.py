from typing import Tuple
from app.services.supabase_client import get_service_client
from app.config import get_settings


def upload_dataset_file(path: str, content: bytes, content_type: str) -> None:
    settings = get_settings()
    supabase = get_service_client()
    supabase.storage.from_(settings.supabase_datasets_bucket).upload(
        path,
        content,
        {"content-type": content_type},
    )


def download_dataset_file(path: str) -> bytes:
    settings = get_settings()
    supabase = get_service_client()
    return supabase.storage.from_(settings.supabase_datasets_bucket).download(path)


def build_dataset_path(user_id: str, dataset_id: str, filename: str) -> str:
    return f"{user_id}/{dataset_id}/{filename}"
