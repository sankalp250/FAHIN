"""Alert log endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List
from datetime import datetime, timedelta

from app.db.session import get_db
from app.schemas.alerts import AlertLogResponse
from app.models.alert_log import AlertLog
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/alerts/active", response_model=List[AlertLogResponse])
async def get_active_alerts(city: str = "Gurugram", db: AsyncSession = Depends(get_db)):
    cutoff = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(AlertLog)
        .where(AlertLog.sent_at >= cutoff)
        .order_by(desc(AlertLog.sent_at))
        .limit(50)
    )
    return result.scalars().all()
