from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.v3_models import Hospital, SymptomReport
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter()

@router.get("/recommendations")
async def get_triage_recommendations(db: AsyncSession = Depends(get_db)):
    # 1. Fetch Hospitals
    hospitals_result = await db.execute(select(Hospital))
    hospitals = hospitals_result.scalars().all()
    
    # 2. Fetch Report Counts by Sector (Last 24h)
    yesterday = datetime.utcnow() - timedelta(days=1)
    reports_stmt = select(
        SymptomReport.city_sector, 
        func.count(SymptomReport.id).label("count"),
        func.avg(SymptomReport.severity).label("avg_severity")
    ).where(SymptomReport.created_at >= yesterday).group_by(SymptomReport.city_sector)
    
    reports_result = await db.execute(reports_stmt)
    sector_demand = {row.city_sector: {"count": row.count, "severity": row.avg_severity} for row in reports_result.all()}
    
    # 3. Calculate Recommendations
    recommendations = []
    
    # Group hospitals by sector for easier lookup
    hospitals_by_sector = {}
    for h in hospitals:
        if h.sector not in hospitals_by_sector:
            hospitals_by_sector[h.sector] = []
        hospitals_by_sector[h.sector].append(h)
        
    for sector, demand in sector_demand.items():
        sector_hospitals = hospitals_by_sector.get(sector, [])
        total_beds = sum(h.icu_beds_available for h in sector_hospitals)
        
        # Logic: If high severity/count and low available beds
        if (demand["count"] > 10 or demand["severity"] > 0.6) and total_beds < 5:
            # Find nearest sector with surplus (Simplified logic)
            surplus_sector = None
            for s, h_list in hospitals_by_sector.items():
                if s != sector and sum(h.icu_beds_available for h in h_list) > 20:
                    surplus_sector = s
                    break
            
            if surplus_sector:
                recommendations.append({
                    "type": "Critical Reallocation",
                    "priority": "High",
                    "sector": sector,
                    "reason": f"High symptom density ({demand['count']} cases) with only {total_beds} beds available.",
                    "action": f"Shift emergency response units from {surplus_sector} to {sector} medical centers."
                })

    # Default recommendation if nothing critical
    if not recommendations:
        recommendations.append({
            "type": "Routine Optimization",
            "priority": "Low",
            "sector": "All Districts",
            "reason": "Current load is within capacity thresholds.",
            "action": "Maintain standard rotation of oxygen supply lines."
        })
        
    return recommendations

@router.get("/infrastructure-map")
async def get_infrastructure_map(db: AsyncSession = Depends(get_db)):
    """Groups hospitals by sector for the dashboard view."""
    stmt = select(Hospital).order_by(Hospital.sector)
    result = await db.execute(stmt)
    hospitals = result.scalars().all()
    
    mapping = {}
    for h in hospitals:
        if h.sector not in mapping:
            mapping[h.sector] = []
        mapping[h.sector].append({
            "id": str(h.id),
            "name": h.name,
            "beds": f"{h.icu_beds_available}/{h.icu_beds_total}",
            "oxygen": h.oxygen_status,
            "status": "Stable" if h.oxygen_status > 60 else "Critical"
        })
    return mapping
