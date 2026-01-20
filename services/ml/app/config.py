from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_datasets_bucket: str = "datasets"
    supabase_models_bucket: str = "models"

    environment: str = "development"
    debug: bool = True
    max_sample_size: int = 200000
    pytorch_min_rows: int = 250000
    pytorch_min_features: int = 200
    pytorch_default_epochs: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
