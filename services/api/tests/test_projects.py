class DummyResult:
    def __init__(self, data):
        self.data = data


def test_list_projects_returns_payload(client, monkeypatch):
    async def fake_get_projects(user_id=None):
        _ = user_id
        return DummyResult([{"id": "demo", "name": "Demo", "created_at": "2024-01-01T00:00:00Z"}])

    from app.services.supabase import supabase_service

    monkeypatch.setattr(supabase_service, "get_projects", fake_get_projects)

    response = client.get("/api/projects")
    assert response.status_code == 200
    assert "projects" in response.json()
