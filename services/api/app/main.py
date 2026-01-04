from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import health, projects, datasets, code, visuals, chat

settings = get_settings()

app = FastAPI(
    title="DataCanvas API",
    description="Core API service for DataCanvas",
    version="1.0.0",
)

origins = [origin.strip() for origin in settings.cors_origins.split(",")] if settings.cors_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(datasets.router, prefix="/api", tags=["datasets"])
app.include_router(code.router, prefix="/api", tags=["code"])
app.include_router(visuals.router, prefix="/api", tags=["visuals"])
app.include_router(chat.router, prefix="/api", tags=["chat"])


@app.get("/")
def root():
    return {"service": "DataCanvas API", "status": "running"}
