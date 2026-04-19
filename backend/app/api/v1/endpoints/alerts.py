from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.v3_models import OutbreakAlert
from pydantic import BaseModel

router = APIRouter()

class BroadcastRequest(BaseModel):
    alert_id: str

@router.get("/")
async def get_active_alerts(db: AsyncSession = Depends(get_db)):
    stmt = select(OutbreakAlert).order_by(OutbreakAlert.created_at.desc())
    result = await db.execute(stmt)
    alerts = result.scalars().all()
    
    return [
        {
            "id": f"ALT-{str(a.id)[:2].upper()}",
            "sector": a.city_sector,
            "type": a.disease,
            "severity": "Critical" if a.risk_score > 0.8 else "High",
            "cases": 25, # Mock count for now, in real it would be aggregated
            "growth": "+12%", # Mock trend
            "status": "Active"
        }
        for a in alerts
    ]

@router.post("/broadcast")
async def broadcast_alert(payload: BroadcastRequest, db: AsyncSession = Depends(get_db)):
    # This would integrate with a notification service (WhatsApp/SMS)
    # For now, we simulate success
    return {
        "status": "success",
        "message": f"Broadcast sent for alert {payload.alert_id} to all citizens in the sector."
    }
