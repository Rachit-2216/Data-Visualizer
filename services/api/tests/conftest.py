import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
    os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "service-role-key")
    os.environ.setdefault("SUPABASE_ANON_KEY", "anon-key")
    os.environ.setdefault("SUPABASE_JWT_SECRET", "jwt-secret")
    os.environ.setdefault("GROQ_API_KEY", "test-key")

    from app.main import app

    return TestClient(app)
