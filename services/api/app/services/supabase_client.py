import os
from supabase import create_client, Client
from functools import lru_cache
from app.config import get_settings


@lru_cache()
def get_service_client() -> Client:
    for key in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]:
        os.environ.pop(key, None)
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache()
def get_anon_client() -> Client:
    for key in ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"]:
        os.environ.pop(key, None)
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)
