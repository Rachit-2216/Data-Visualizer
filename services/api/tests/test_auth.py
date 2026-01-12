def test_auth_requires_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
