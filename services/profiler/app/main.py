from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.api.routes import health, profile, jobs
from app.services.job_processor import JobProcessor


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the job processor
    processor = JobProcessor()
    task = asyncio.create_task(processor.start_polling())
    yield
    # Shutdown: Cancel the job processor
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="DataCanvas Profiler",
    description="Dataset profiling service for DataCanvas",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(profile.router, prefix="/api", tags=["profile"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])


@app.get("/")
async def root():
    return {"service": "DataCanvas Profiler", "status": "running"}
