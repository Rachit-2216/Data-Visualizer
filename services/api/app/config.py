from functools import lru_cache
import json
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    supabase_jwt_secret: str
    supabase_datasets_bucket: str = "datasets"
    supabase_models_bucket: str = "models"

    # Groq
    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-70b-versatile"

    # App
    environment: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:3000"

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    class Config:
        env_file = ".env"
        extra = "ignore"

    def cors_origins_list(self) -> list[str]:
        value = self.cors_origins
        if isinstance(value, list):
            return value
        if not value:
            return []
        trimmed = value.strip()
        if trimmed.startswith("["):
            try:
                parsed = json.loads(trimmed)
                if isinstance(parsed, list):
                    return [str(origin).strip() for origin in parsed if str(origin).strip()]
            except json.JSONDecodeError:
                return [origin.strip() for origin in trimmed.strip("[]").split(",") if origin.strip()]
        return [origin.strip() for origin in trimmed.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
