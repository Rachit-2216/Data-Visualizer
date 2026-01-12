import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.error_handler import error_handler_middleware
from app.middleware.logging import logging_middleware
from app.routers import auth, projects, datasets, profiles, visuals, chat, ml, jobs, websocket
from app.routers import code as code_router


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting DataCanvas API...")
    yield
    logger.info("Shutting down DataCanvas API...")


app = FastAPI(
    title="DataCanvas API",
    description="Backend API for DataCanvas - No-code ML Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.middleware("http")(error_handler_middleware)
app.middleware("http")(logging_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(visuals.router, prefix="/api/visuals", tags=["Visualizations"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(ml.router, prefix="/api/ml", tags=["ML Models"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])
app.include_router(code_router.router, prefix="/api/code", tags=["Code"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/")
async def root():
    return {"message": "DataCanvas API", "docs": "/docs"}
