from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_datasets_bucket: str = "datasets"

    # Profiling settings
    max_sample_size: int = 50000
    head_sample_size: int = 5000
    max_file_size_mb: int = 200

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
