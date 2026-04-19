from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.v3_models import SymptomReport, OutbreakAlert, SystemConfig
from app.services.weather_service import weather_service
from typing import List, Dict

router = APIRouter()

@router.get("/weather")
async def get_city_weather(db: AsyncSession = Depends(get_db)):
    # Get active city from config
    stmt = select(SystemConfig).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    
    city = config.active_city if config else "Kolkata"
    weather_data = await weather_service.get_weather_for_city(city)
    
    if not weather_data:
        return {"error": "Weather data unavailable"}
    return weather_data

@router.get("/metrics")
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    # Get active city from config
    stmt = select(SystemConfig).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    city = config.active_city if config else "Kolkata"

    # 1. Total Active Cases (Total reports for the active city)
    total_cases_stmt = select(func.count(SymptomReport.id)).where(SymptomReport.city == city)
    total_cases = await db.scalar(total_cases_stmt)
    
    # 2. Anomaly Status
    anomaly_stmt = select(func.count(SymptomReport.id)).where(
        SymptomReport.city == city,
        SymptomReport.is_anomaly == True
    )
    anomaly_count = await db.scalar(anomaly_stmt)
    anomaly_status = "High" if anomaly_count > 5 else "Low"
    
    # 3. Risk Index (Average severity of recent reports for the city)
    risk_index_stmt = select(func.avg(SymptomReport.severity)).where(SymptomReport.city == city)
    avg_severity = await db.scalar(risk_index_stmt) or 0
    risk_index = f"{int(avg_severity * 100)}%"
    
    # 4. AI Confirmations (Total alerts for the city)
    alerts_stmt = select(func.count(OutbreakAlert.id)).where(OutbreakAlert.city == city)
    ai_confirmations = await db.scalar(alerts_stmt)
    
    return {
        "city": city,
        "active_cases": f"{total_cases:,}",
        "anomaly_status": anomaly_status,
        "risk_index": risk_index,
        "ai_confirmations": str(ai_confirmations)
    }

@router.get("/heatmap")
async def get_heatmap_data(db: AsyncSession = Depends(get_db)):
    # Get active city from config
    stmt_config = select(SystemConfig).limit(1)
    result_config = await db.execute(stmt_config)
    config = result_config.scalar_one_or_none()
    city = config.active_city if config else "Kolkata"

    # Group reports by sector for the active city
    stmt = select(
        SymptomReport.city_sector,
        func.avg(SymptomReport.anomaly_score).label("avg_anomaly"),
        func.count(SymptomReport.id).label("case_count")
    ).where(SymptomReport.city == city).group_by(SymptomReport.city_sector)
    
    results = await db.execute(stmt)
    
    heatmap = []
    rows = results.all()
    
    # If no data for this city, inject dummy sectors for visualization if requested
    if not rows and city != "Kolkata":
         # Fallback mock data for new cities to keep UI alive
         for i in range(1, 4):
             heatmap.append({
                "id": str(i),
                "name": f"Sector {i}",
                "anomalyScore": 10.0 + (i * 5),
                "caseDensity": 5 + (i * 2),
                "riskLevel": "safe"
            })
         return heatmap

    for row in rows:
        # Calculate risk level
        risk_level = "safe"
        if row.avg_anomaly > 70 or row.case_count > 10:
            risk_level = "critical"
        elif row.avg_anomaly > 40:
            risk_level = "warning"
            
        heatmap.append({
            "id": row.city_sector.lower().replace(" ", "-"),
            "name": row.city_sector,
            "anomalyScore": round(row.avg_anomaly, 1),
            "caseDensity": row.case_count, 
            "riskLevel": risk_level
        })
        
    return heatmap
