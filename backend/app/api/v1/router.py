"""Aggregates all v1 API routers into one include."""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    symptoms, predictions, pharmacy, hospitals,
    alerts, federated, prescriptions, agents, auth,
)

api_router = APIRouter()

api_router.include_router(symptoms.router,      prefix="/symptoms",      tags=["Symptoms"])
api_router.include_router(predictions.router,   prefix="",               tags=["Predictions"])
api_router.include_router(pharmacy.router,      prefix="/pharmacy",      tags=["Pharmacy"])
api_router.include_router(hospitals.router,     prefix="/hospitals",     tags=["Hospitals"])
api_router.include_router(alerts.router,        prefix="/alerts",        tags=["Alerts"])
api_router.include_router(federated.router,     prefix="/federated",     tags=["Federated Learning"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Prescriptions"])
api_router.include_router(agents.router,        prefix="/agents",        tags=["Agents"])
api_router.include_router(auth.router,          prefix="/auth",          tags=["Auth"])
