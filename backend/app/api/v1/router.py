from fastapi import APIRouter
from app.api.v1.endpoints import health, dashboard, reports, alerts, settings, hospitals, triage

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
api_router.include_router(triage.router, prefix="/triage", tags=["triage"])
