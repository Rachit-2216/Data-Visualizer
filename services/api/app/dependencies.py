from app.config import settings
from app.services.supabase import supabase_service


def get_settings():
    return settings


def get_supabase_service():
    return supabase_service
