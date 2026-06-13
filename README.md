# DataCanvas

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <img src="https://img.shields.io/badge/Storage-Browser%20Local-65D8EE?style=for-the-badge" alt="Browser-local storage" />
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/Groq-Llama%203.1%2070B-F55036?style=for-the-badge" alt="Groq" /></a>
  <a href="https://threejs.org/"><img src="https://img.shields.io/badge/Three.js-3D%20Landing-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Services-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

No-code dataset visualizer, AI analyst, and ML playground with a cinematic public frontend and a VS Code-style data workspace.

Upload messy datasets, profile them automatically, generate useful visualizations, ask questions in plain English, and run ML experiments without living inside another `Untitled-47.ipynb`.

---

## Table of Contents

- [What This Project Does](#what-this-project-does)
- [Core Features](#core-features)
- [Public Landing Experience](#public-landing-experience)
- [End-to-End Product Flow](#end-to-end-product-flow)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Run Services](#run-services)
- [Environment Variables](#environment-variables)
- [Local-First Data Mode](#local-first-data-mode)
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

- A polished animated landing page for the public product story
- An editor/workspace-style frontend for data work
- Browser-local projects, datasets, profiles, charts, and conversations
- Client-side parsing and profiling for the supported upload formats
- Optional FastAPI, profiling, and ML services for future heavier workloads
- Groq for optional LLM-powered conversational analysis

---

## Core Features

- Multi-format dataset upload (`csv`, `tsv`, `json`, `parquet`, `xlsx`)
- Automatic dataset profiling and data quality checks
- Dynamic chart generation and saved visualizations
- Workspace tabs for data, visuals, and CodeViz
- CodeViz with interactive model architecture, loss, and training views
- AI assistant with streaming responses and chart-capable outputs
- Local-first persistence with no database or sign-in requirement
- Animated Chaos Lab landing page with Data Phoenix scrollytelling, hover reveals, and easter eggs

---

## Public Landing Experience

The active public frontend lives in `apps/web/src/components/landing-v2` and is assembled from `apps/web/src/app/page.tsx`.

The current landing concept is **DataCanvas Chaos Lab**:

- Hero: kinetic editorial headline, cursor-reactive data constellation, suspicious dataset mockup, and "hover truth serum" copy reveals
- Scroll story: a Data Phoenix carries one ugly file through the product loop while the scene, copy, preview cards, and progress rail move with scroll
- Format wall: CSV, TSV, JSON, XLSX, and Parquet are treated as animated dataset suspects with distinct hover jokes
- AI Analyst: prompt examples, chat-style answer preview, and product copy for natural-language data questions
- ML Lab: model-training section for classification, regression, clustering, and readable metrics
- Product proof: schema detection, missing value analysis, outliers, correlation maps, generated charts, AI explanations, ML experiments, and fallback sessions
- Easter eggs: suspicious cell click messages, `misc` jokes, footer reveal copy, and Konami-code banner

The current landing uses normal browser scrolling and Framer Motion-driven transforms rather than scroll hijacking.

---

## End-to-End Product Flow

1. User creates/selects a project.
2. User uploads a dataset directly in the browser.
3. The client parser reads the file and builds typed sample rows.
4. Local profiling computes schema, stats, warnings, and quality signals.
5. The Visuals tab builds chart recommendations from the uploaded columns and rows.
6. User can optionally chat with Groq using the local dataset context.
7. User can explore model architecture and experiment views in CodeViz.

---

## Architecture

```text
apps/web (Next.js frontend)
  -> browser storage (projects, datasets, profiles, charts, conversations)
  -> local parsers/profiler (CSV, TSV, JSON, Excel, Parquet)
  -> Groq API (optional LLM chat through a Next.js route)

Optional service prototypes:
  -> services/api
  -> services/profiler
  -> services/ml
```

---

## Monorepo Structure

```text
datacanvas/
  apps/
    web/                    # Next.js frontend
      src/components/landing-v2/
                              # current public Chaos Lab landing page
  services/
    api/                    # FastAPI gateway
    profiler/               # profiling worker service
    ml/                     # ML service
  packages/
    types/                  # shared TypeScript types
  scripts/                  # local regression and verification scripts
```

---

## Tech Stack

Frontend:

- Next.js 14
- React 18
- TypeScript
- Zustand
- Tailwind + shadcn/ui
- Framer Motion
- Three.js + React Three Fiber for lightweight visual scenes
- lucide-react icons

Backend:

- FastAPI
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
- Groq API key only if you want live AI chat
- Docker Desktop only if you want to explore the optional Python services

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

The complete current product experience runs from the frontend package:

```bash
pnpm -C apps/web dev
```

Frontend: `http://localhost:3000`

The Python services under `services/` are optional prototypes and are not required
for local uploads, profiling, generated visuals, saved charts, or workspace state.

---

## Environment Variables

Use local env files. Never commit real keys.

### `apps/web/.env.local`

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-70b-versatile
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Local-First Data Mode

The active workspace deliberately runs without a database dependency:

- Projects and uploaded datasets persist in browser storage on the current device
- Files are parsed and profiled in the browser
- Generated visuals use the uploaded dataset's real columns and sample rows
- Saved charts and chat threads stay local
- Login and signup URLs redirect directly to the workspace

Clearing site data or switching browsers removes local workspace state. Keep original
datasets outside the app when long-term archival matters.

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

Deploy `apps/web` to Vercel. The deployed workspace remains browser-local for each
visitor, so users can upload and analyze files without a shared database.

Add `GROQ_API_KEY` and `GROQ_MODEL` in Vercel only when enabling live AI chat.

---

## Security Notes

- `.env*` is ignored by git (except examples)
- `context_document.md` is ignored by git
- Do not commit API keys
- Keep Groq credentials server-side
- Rotate keys immediately if exposure is suspected

---

## Screenshots

Add your screenshots later under `docs/screenshots/`.

Suggested files:

- `docs/screenshots/landing-chaos-lab.png`
- `docs/screenshots/phoenix-scroll-story.png`
- `docs/screenshots/workspace.png`
- `docs/screenshots/visuals.png`
- `docs/screenshots/codeviz.png`
- `docs/screenshots/chat.png`

Example markdown:

```md
![Landing](docs/screenshots/landing-chaos-lab.png)
![Phoenix Scroll Story](docs/screenshots/phoenix-scroll-story.png)
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
