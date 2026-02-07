# DataCanvas

<p align="center">
  <img alt="DataCanvas" src="https://img.shields.io/badge/DataCanvas-Workspace-0ea5e9?style=for-the-badge" />
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs&logoColor=white" />
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white" />
  <img alt="Groq" src="https://img.shields.io/badge/Groq-Llama%203.1%2070B-FF4F00" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-3D%20UI-000000?logo=three.js&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Services-2496ED?logo=docker&logoColor=white" />
</p>

No-code dataset visualizer and ML playground with a VS Code style workspace. Upload data, explore auto-generated visuals, and ask the AI assistant for insights and chart specs.

---

## Highlights

- Upload CSV, TSV, JSON, Parquet, XLSX
- Automatic profiling and visualization generation
- Interactive charts with expand and export
- CodeViz tab for ML architecture visualization (2D/3D)
- AI assistant via Groq with streaming responses
- Demo and offline fallback without Supabase
- Modular backend services: API gateway, profiler, ML service

---

## Architecture

```
Next.js (apps/web)
  -> FastAPI Gateway (services/api)
       -> Supabase (Postgres + Auth + Storage)
       -> Profiler (services/profiler)
       -> ML Service (services/ml)
       -> Groq (LLM)
```

---

## Repo Structure

```
apps/
  web/                  # Next.js frontend
services/
  api/                  # FastAPI gateway
  profiler/             # Background profiling worker
  ml/                   # ML service (optional)
packages/
  types/                # Shared TypeScript types
supabase/
  migrations/           # Schema + RLS + seed data
```

---

## Quick Start

### Prerequisites

- Node.js 18 or 20
- pnpm 9+
- Docker Desktop (for API + profiler)

### Install

```
pnpm install
```

### Frontend (Next.js)

```
pnpm -C apps/web dev
```

### API + Profiler

```
cd services/api
docker compose up --build
```

```
cd services/profiler
docker compose up --build
```

---

## Environment Variables

Never commit real secrets. Use the example files and set your own values.

### Frontend (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
```

### API (`services/api/.env`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_DATASETS_BUCKET=datasets
SUPABASE_MODELS_BUCKET=models
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
```

### Profiler (`services/profiler/.env`)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DATASETS_BUCKET=datasets
```

---

## Offline and Demo Mode

If Supabase env vars are not configured, DataCanvas falls back to offline mode:

- Projects and datasets are stored in local storage
- Uploads are parsed locally (CSV, TSV, JSON, XLSX, and Parquet via DuckDB WASM)
- Profiles and charts are generated client-side

This is ideal for public demos or Vercel previews without a database.

---

## Supported File Types

- CSV (large files are sampled for responsiveness)
- TSV
- JSON (array of objects)
- Parquet
- XLSX / XLS

For very large datasets, use the backend profiler for full analysis.

---

## Landing Page Media

The landing page hero references a space travel video:

```
apps/web/public/media/space-jump.mp4
```

This should be an 8-10s loopable MP4.

---

## Scripts

### Frontend

```
pnpm -C apps/web dev
pnpm -C apps/web build
pnpm -C apps/web start
```

### API

```
cd services/api
docker compose up --build
```

### Profiler

```
cd services/profiler
docker compose up --build
```

---

## Deployment Notes

- Frontend: Vercel
- Backend: Docker host (Railway, Fly.io, or VPS)
- Public demo: use offline fallback and disable Supabase endpoints

---

## Screenshots

Add screenshots here later:

```
docs/screenshots/landing.png
docs/screenshots/workspace.png
docs/screenshots/codeviz.png
```

Example:

```
![Landing](docs/screenshots/landing.png)
![Workspace](docs/screenshots/workspace.png)
![CodeViz](docs/screenshots/codeviz.png)
```

---

## Contributing

1. Fork the repo
2. Create a branch
3. Submit a PR with a clear description and screenshots if UI-related

---

## License

MIT
