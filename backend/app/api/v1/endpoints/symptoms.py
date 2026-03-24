"""
FAHIN — Symptom Reports API Endpoint
POST /api/v1/symptoms/report
GET  /api/v1/symptoms/sector/{sector_id}
GET  /api/v1/symptoms/trends
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from app.db.session import get_db
from app.schemas.symptoms import SymptomReportCreate, SymptomReportResponse, SectorTrend
from app.models.symptom_report import SymptomReport
from app.services.agents.orchestrator import process_symptom_report
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/symptoms/report",
    response_model=SymptomReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a symptom report",
    description="Citizens submit their symptoms. PII is stripped immediately. Processed async by LangChain agents.",
)
async def submit_symptom_report(
    report: SymptomReportCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a citizen symptom report.
    
    - **symptoms**: List of symptom strings (e.g., ["fever", "headache", "joint_pain"])
    - **severity**: 1-10 scale
    - **city_sector**: City sector code (e.g., "Sector-45")
    - **city**: City name
    
    Processing happens asynchronously via LangChain agent pipeline.
    """
    try:
        # Create the symptom report record
        db_report = SymptomReport(
            user_id=current_user.id,
            symptoms=report.symptoms,
            severity=report.severity,
            duration_days=report.duration_days,
            city_sector=report.city_sector,
            city=report.city,
            reported_aqi=report.reported_aqi,
            reported_temp_c=report.reported_temp_c,
            reported_humidity=report.reported_humidity,
            source="mobile" if report.source is None else report.source,
        )
        db.add(db_report)
        await db.commit()
        await db.refresh(db_report)
        
        # Queue async processing by LangChain agent pipeline
        background_tasks.add_task(
            process_symptom_report,
            report_id=str(db_report.id),
            sector=report.city_sector,
            city=report.city,
        )
        
        logger.info(f"Symptom report {db_report.id} submitted from sector {report.city_sector}")
        return db_report
        
    except Exception as e:
        logger.error(f"Failed to submit symptom report: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process symptom report. Please try again.",
        )


@router.get(
    "/symptoms/sector/{sector_id}",
    response_model=List[SymptomReportResponse],
    summary="Get symptom reports for a sector",
    description="Returns anonymised symptom reports for a city sector. Hospital admins only.",
)
async def get_sector_symptoms(
    sector_id: str,
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent symptom reports for a sector (hospital admins and city admins only)."""
    if current_user.role not in ("hospital_admin", "city_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hospital admins can view sector symptom data.",
        )
    
    from sqlalchemy import select, and_
    from datetime import datetime, timedelta
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(SymptomReport)
        .where(
            and_(
                SymptomReport.city_sector == sector_id,
                SymptomReport.created_at >= cutoff,
            )
        )
        .order_by(SymptomReport.created_at.desc())
        .limit(500)
    )
    return result.scalars().all()


@router.get(
    "/symptoms/trends",
    response_model=List[SectorTrend],
    summary="Get symptom trends across all sectors",
    description="Returns disease trend data for the city dashboard heatmap.",
)
async def get_symptom_trends(
    city: str,
    days: int = 14,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get city-wide symptom trend aggregates for the heatmap dashboard."""
    from sqlalchemy import text
    
    result = await db.execute(
        text("""
            SELECT 
                city_sector,
                DATE(created_at) as report_date,
                COUNT(*) as total_reports,
                predicted_disease,
                AVG(prediction_confidence) as avg_confidence
            FROM symptom_reports
            WHERE city = :city
                AND created_at >= NOW() - INTERVAL ':days days'
                AND predicted_disease IS NOT NULL
            GROUP BY city_sector, DATE(created_at), predicted_disease
            ORDER BY report_date DESC, total_reports DESC
        """),
        {"city": city, "days": days}
    )
    return result.fetchall()
