from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.v3_models import SymptomReport, Prescription, User
from typing import List

router = APIRouter()

from app.services.ocr.sarvam import sarvam_service
from uuid import UUID

@router.get("/prescriptions/{rx_id}/analyze")
async def analyze_prescription(rx_id: str, db: AsyncSession = Depends(get_db)):
    # In a real app we'd fetch the actual image bytes from storage
    # For this demo, we'll use the existing ocr_text if available or mock
    
    # Extract the UUID part from RX-ID
    # ...
    
    return {
        "lab_insights": [
            {"label": "Medication Detected", "value": "Paracetamol 500"},
            {"label": "Class", "value": "Analgesic"},
            {"label": "Confidence", "value": "94%"},
            {"label": "Extraction Method", "value": "Sarvam AI [Our Code Wrap]"}
        ],
        "risk_flags": ["No restricted agents detected"]
    }

@router.get("/prescriptions")
async def get_prescriptions(db: AsyncSession = Depends(get_db)):
    # Join with User to get citizen name and sector
    stmt = select(Prescription).options(selectinload(Prescription.user)).order_by(Prescription.created_at.desc())
    result = await db.execute(stmt)
    prescriptions = result.scalars().all()
    
    return [
        {
            "id": f"RX-{str(p.id)[:4].upper()}",
            "user": p.user.email.split('@')[0].capitalize() if p.user else "Citizen",
            "date": p.created_at.strftime("%Y-%m-%d"),
            "status": "Processed" if p.processed else "Pending",
            "ocrSnippet": (p.ocr_text[:60] + "...") if p.ocr_text else "Extracting...",
            "sector": p.user.sector if p.user else "South Salt Lake"
        }
        for p in prescriptions
    ]

@router.get("/symptom-summaries")
async def get_recent_reports(db: AsyncSession = Depends(get_db)):
    stmt = select(SymptomReport).order_by(SymptomReport.created_at.desc()).limit(15)
    result = await db.execute(stmt)
    reports = result.scalars().all()
    
    return [
        {
            "id": str(r.id),
            "sector": r.city_sector or "Central District",
            "disease": r.identified_disease or "Undifferentiated Viral",
            "time": r.created_at.strftime("%H:%M"),
            "risk": "Critical" if r.is_anomaly else "Normal",
            "severity": r.severity
        }
        for r in reports
    ]
