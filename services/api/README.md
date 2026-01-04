# DataCanvas API Service

## Setup

1) Copy env file:

```bash
cp .env.example .env
```

2) Fill in:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DATASETS_BUCKET`
- `GEMINI_API_KEY` (optional, for /api/chat)

## Run with Docker

```bash
docker compose up --build
```

## Local run (no Docker)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Endpoints

- `GET /health`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/{project_id}/datasets`
- `POST /api/datasets/{dataset_id}/upload`
- `GET /api/datasets/{dataset_id}/versions`
- `GET /api/datasets/versions/{version_id}/profile`
- `POST /api/code/parse`
- `POST /api/visuals/simulate`
- `GET /api/visuals/sections/{version_id}`
- `POST /api/chat`
