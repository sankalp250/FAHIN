"""Agent pipeline status endpoints."""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

AGENTS = [
    "PrivacyGuardian","SymptomIntelligence","CityRisk","MedicalKnowledge","OutbreakPrediction"
]

@router.get("/status")
async def get_agent_status():
    return {
        "agents": [
            {"name": a, "status": "active", "processed_today": 0,
             "last_run": datetime.utcnow().isoformat(), "error_rate_pct": 0.0}
            for a in AGENTS
        ],
        "pipeline_healthy": True,
    }
