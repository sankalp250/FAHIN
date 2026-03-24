"""Outbreak prediction endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List
from datetime import date, datetime
import uuid

from app.db.session import get_db
from app.schemas.predictions import PredictionResponse, CityHeatmapResponse, SectorRiskSummary
from app.models.outbreak_prediction import OutbreakPrediction
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/predictions/sector/{sector_id}", response_model=PredictionResponse)
async def get_sector_prediction(
    sector_id: str, db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    result = await db.execute(
        select(OutbreakPrediction)
        .where(OutbreakPrediction.city_sector == sector_id)
        .order_by(desc(OutbreakPrediction.created_at))
        .limit(1)
    )
    pred = result.scalar_one_or_none()
    if not pred:
        raise HTTPException(status_code=404, detail="No prediction found for this sector")
    return pred


@router.get("/predictions/city", response_model=List[PredictionResponse])
async def get_city_predictions(city: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import func
    # Get the latest prediction per sector
    subq = (
        select(OutbreakPrediction.city_sector, func.max(OutbreakPrediction.created_at).label("latest"))
        .where(OutbreakPrediction.city == city)
        .group_by(OutbreakPrediction.city_sector)
        .subquery()
    )
    result = await db.execute(
        select(OutbreakPrediction).join(
            subq,
            and_(
                OutbreakPrediction.city_sector == subq.c.city_sector,
                OutbreakPrediction.created_at == subq.c.latest,
            )
        )
    )
    return result.scalars().all()


@router.get("/dashboard/city-heatmap", response_model=CityHeatmapResponse)
async def get_city_heatmap(city: str = "Gurugram", db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    result = await db.execute(
        text("""
            SELECT city_sector, MAX(probability) as risk_score,
                   disease as top_disease, 0 as report_count_7d,
                   'stable' as trend
            FROM outbreak_predictions
            WHERE city = :city AND prediction_date >= CURRENT_DATE - INTERVAL '3 days'
            GROUP BY city_sector, disease
            ORDER BY risk_score DESC
        """),
        {"city": city}
    )
    rows = result.fetchall()
    sectors = [
        SectorRiskSummary(
            sector=r.city_sector, risk_score=r.risk_score,
            top_disease=r.top_disease, report_count_7d=r.report_count_7d,
            trend=r.trend
        ) for r in rows
    ]
    return CityHeatmapResponse(city=city, sectors=sectors, generated_at=datetime.utcnow())


@router.get("/dashboard/city-stats")
async def get_city_stats(city: str = "Gurugram", db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, text
    alert_count = await db.execute(
        select(func.count()).select_from(OutbreakPrediction)
        .where(and_(OutbreakPrediction.city == city, OutbreakPrediction.alert_sent == True))
    )
    return {
        "total_reports_today": 0,
        "active_alerts": alert_count.scalar_one() or 0,
        "high_risk_sectors": 0,
        "models_online": 4,
        "fl_round_current": 1,
        "fl_hospitals_participating": 0,
    }
