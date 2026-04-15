"""FAHIN Backend — FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.services.ml.model_registry import ModelRegistry

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FAHIN API server...")
    ModelRegistry.load_all_models()
    logger.info("ML models loaded.")
    yield
    logger.info("Shutting down FAHIN API server.")


app = FastAPI(
    title="FAHIN — Federated Agentic Health Intelligence Network",
    description="City-wide AI disease outbreak detection. Privacy-preserving via federated learning.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# Single include — all routes via api_router
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "FAHIN API",
        "version": "1.0.0",
        "models_loaded": ModelRegistry.is_loaded(),
    }


@app.get("/", tags=["Root"])
async def root():
    return {"message": "FAHIN API", "docs": "/docs", "health": "/health"}
