# DataCanvas

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-Llama%203.1%2070B-F55036?style=for-the-badge" alt="Groq" /></a>
  <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-3D%20Landing-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Services-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

No-code dataset visualizer and ML playground with a VS Code-style workspace.

Upload data, auto-generate profiles and visualizations, chat with AI for insights, and explore model behavior in interactive 2D/3D views.

---

## Table of Contents

- [What This Project Does](#what-this-project-does)
- [Core Features](#core-features)
- [End-to-End Product Flow](#end-to-end-product-flow)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Run Services](#run-services)
- [Environment Variables](#environment-variables)
- [Offline and Demo Mode](#offline-and-demo-mode)
- [Supported File Formats](#supported-file-formats)
- [AI Chat (Groq) Setup](#ai-chat-groq-setup)
- [Scripts](#scripts)
- [Deployment Notes](#deployment-notes)
- [Security Notes](#security-notes)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## What This Project Does

DataCanvas is built for users who want fast answers from data without manually wiring charts, pipelines, and model tooling.

It combines:

- An editor/workspace-style frontend for data work
- A FastAPI backend for projects/datasets/chat/ML orchestration
- Background profiling and ML services
- Supabase for auth, DB, storage, and persistence
- Groq for LLM-powered conversational analysis

---

## Core Features

- Multi-format dataset upload (`csv`, `tsv`, `json`, `parquet`, `xlsx`)
- Automatic dataset profiling and data quality checks
- Dynamic chart generation and saved visualizations
- Workspace tabs for data, visuals, and CodeViz
- CodeViz with interactive model architecture, loss, and training views
- AI assistant with streaming responses and chart-capable outputs
- Demo/offline fallback mode when backend persistence is unavailable
- 3D landing page effects (space-time mesh, scroll interactions, pinned sections)

---

## End-to-End Product Flow

1. User creates/selects a project.
2. User uploads dataset metadata and file.
3. API writes metadata to DB and file to storage.
4. Profiler service picks queued jobs and computes schema/stats/warnings/sample/correlations.
5. Frontend loads profile + previews and generates chart recommendations.
6. User can chat with AI for insights or requested visualizations.
7. User can configure/train models and inspect results in CodeViz and model views.

---

## Architecture

```text
apps/web (Next.js frontend)
  -> services/api (FastAPI gateway, port 8001)
       -> Supabase (Postgres + Auth + Storage)
       -> services/profiler (background profiling, port 8000)
       -> services/ml (ML train/inference, port 8002, optional)
       -> Groq API (LLM chat + chart reasoning)
```

---

## Monorepo Structure

```text
datacanvas/
  apps/
    web/                    # Next.js frontend
  services/
    api/                    # FastAPI gateway
    profiler/               # profiling worker service
    ml/                     # ML service
  packages/
    types/                  # shared TypeScript types
  supabase/
    migrations/             # DB schema and RLS migrations
```

---

## Tech Stack

Frontend:

- Next.js 14
- React 18
- TypeScript
- Zustand
- Tailwind + shadcn/ui
- Three.js + React Three Fiber + Drei
- GSAP + Lenis

Backend:

- FastAPI
- Supabase Python client
- Polars/Pandas-based profiling flows
- scikit-learn/LightGBM/PyTorch strategy in ML service
- Groq SDK for AI chat and chart generation

Infra:

- Docker Compose for local services
- Vercel-friendly frontend setup

---

## Local Setup

### 1) Prerequisites

- Node.js `>=18`
- `pnpm >=9`
- Docker Desktop
- Supabase project (recommended for full mode)
- Groq API key

### 2) Clone

```bash
git clone https://github.com/Rachit-2216/Data-Visualizer.git
cd Data-Visualizer
```

### 3) Install dependencies

```bash
pnpm install
```

---

## Run Services

Run each in a separate terminal.

### Terminal A: API Gateway

```bash
cd services/api
docker compose up --build
```

API: `http://localhost:8001`

### Terminal B: Profiler Service

```bash
cd services/profiler
docker compose up --build
```

Profiler: `http://localhost:8000`

### Terminal C: ML Service (optional but recommended)

```bash
cd services/ml
docker compose up --build
```

ML: `http://localhost:8002`

### Terminal D: Frontend

```bash
pnpm -C apps/web dev
```

Frontend: `http://localhost:3000`

---

## Environment Variables

Use local env files. Never commit real keys.

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-70b-versatile
```

### `services/api/.env`

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_DATASETS_BUCKET=datasets
SUPABASE_MODELS_BUCKET=models
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-70b-versatile
```

### `services/profiler/.env`

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DATASETS_BUCKET=datasets
```

### `services/ml/.env` (if using ML service)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DATASETS_BUCKET=datasets
SUPABASE_MODELS_BUCKET=models
```

---

## Offline and Demo Mode

DataCanvas supports a fallback mode for public demos or temporary no-DB operation.

If Supabase is unavailable:

- Project/dataset state can fall back to browser-local behavior
- Upload parsing still works client-side for supported formats
- Visualization and analysis remain usable in reduced mode
- Persistence and multi-session continuity are limited

This is useful for Vercel previews when backend infra is intentionally paused.

---

## Supported File Formats

- CSV (`.csv`)
- TSV (`.tsv`)
- JSON (`.json` as row-object arrays)
- Parquet (`.parquet`)
- Excel (`.xlsx`, `.xls`)

Notes:

- Very large files are sampled/streamed for responsive UX.
- Full profiling and heavy transforms are best handled through backend services.

---

## AI Chat (Groq) Setup

Current chat provider is Groq.

- Backend service file: `services/api/app/services/groq_service.py`
- Frontend chat route proxy: `apps/web/src/app/api/chat/route.ts`

Required:

- Set `GROQ_API_KEY` in API env (and frontend env if needed by local proxy path)
- Set `GROQ_MODEL` (default: `llama-3.1-70b-versatile`)

---

## Scripts

Root:

```bash
pnpm dev       # turbo dev
pnpm build     # turbo build
pnpm lint      # turbo lint
```

Frontend:

```bash
pnpm -C apps/web dev
pnpm -C apps/web build
pnpm -C apps/web start
pnpm -C apps/web lint
pnpm -C apps/web type-check
```

---

## Deployment Notes

Recommended split:

- Frontend: Vercel
- API/Profiler/ML: container host (Railway/Fly.io/VPS)
- Supabase: managed DB/Auth/Storage

For public demo links:

- Keep fallback mode enabled
- Hide privileged actions requiring backend persistence
- Never expose service-role keys in client env

---

## Security Notes

- `.env*` is ignored by git (except examples)
- `context_document.md` is ignored by git
- Do not commit API keys or service-role credentials
- Use service-role keys only in backend services
- Rotate keys immediately if exposure is suspected

---

## Screenshots

Add your screenshots later under `docs/screenshots/`.

Suggested files:

- `docs/screenshots/landing.png`
- `docs/screenshots/workspace.png`
- `docs/screenshots/visuals.png`
- `docs/screenshots/codeviz.png`
- `docs/screenshots/chat.png`

Example markdown:

```md
![Landing](docs/screenshots/landing.png)
![Workspace](docs/screenshots/workspace.png)
![Visuals](docs/screenshots/visuals.png)
![CodeViz](docs/screenshots/codeviz.png)
![Chat](docs/screenshots/chat.png)
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run lint/type-check/build locally
4. Open a PR with a clear summary and screenshots for UI changes

---

## License

MIT
