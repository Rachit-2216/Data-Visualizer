# DataCanvas

No‑code dataset visualizer and ML playground with a VS Code‑style workspace.

**Stack:** Next.js 14, FastAPI, Supabase (Postgres/Auth/Storage), Groq (LLM), Polars/Pandas (profiling), Three.js (3D UI).

---

## Highlights

- Upload CSV/TSV/JSON/Parquet/XLSX and get instant profiling + visuals
- Interactive charts + expandable modals
- AI assistant (Groq) with chart generation
- CodeViz tab for ML architecture visualization (2D/3D)
- Demo mode + offline fallback (no Supabase required)

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

### 1) Install
```
pnpm install
```

### 2) Frontend
```
pnpm -C apps/web dev
```

### 3) API + Profiler
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

Never commit real secrets. Use `.env.example` and `.env.local.example`.

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
GROQ_API_KEY=
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

## Offline / Demo Mode

If Supabase env vars are not configured, DataCanvas auto‑falls back to offline mode:
- Projects and datasets are stored in local storage.
- Uploads are parsed locally (CSV/TSV/JSON/XLSX and Parquet via DuckDB WASM).
- Profiles and charts are generated client‑side.

This is ideal for Vercel preview deployments or public demos without a database.

---

## Supported File Types

- CSV
- TSV
- JSON (array of objects)
- Parquet
- XLSX / XLS

Large files are auto‑sampled to keep UI responsive.

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

## Screenshots

Add screenshots here later:
- `docs/screenshots/landing.png`
- `docs/screenshots/workspace.png`
- `docs/screenshots/codeviz.png`

---

## Contributing

1. Fork the repo
2. Create a branch
3. PR with a clear description and screenshots if UI‑related

---

## License

MIT
