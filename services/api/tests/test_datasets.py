class DummyResult:
    def __init__(self, data):
        self.data = data


def test_list_versions_maps_fields(client, monkeypatch):
    async def fake_get_dataset(dataset_id):
        _ = dataset_id
        return DummyResult({
            "id": "dataset-1",
            "project": {"is_demo": True},
            "dataset_versions": [
                {"id": "v1", "row_count": 10, "column_count": 2, "created_at": "2024-01-01T00:00:00Z"},
            ],
        })

    from app.services.supabase import supabase_service

    monkeypatch.setattr(supabase_service, "get_dataset", fake_get_dataset)

    response = client.get("/api/datasets/dataset-1/versions")
    assert response.status_code == 200
    payload = response.json()
    assert payload["versions"][0]["row_count_est"] == 10
    assert payload["versions"][0]["column_count_est"] == 2
