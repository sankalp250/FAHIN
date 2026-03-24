from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid

class PredictionResponse(BaseModel):
    id: uuid.UUID
    city_sector: str
    disease: str
    probability: float
    predicted_peak_date: Optional[date]
    days_until_peak: Optional[int]
    confidence_interval_low: Optional[float]
    confidence_interval_high: Optional[float]
    classifier_score: Optional[float]
    forecast_score: Optional[float]
    anomaly_score: Optional[float]
    alert_sent: bool
    prediction_date: date
    created_at: datetime
    model_config = {"from_attributes": True}

class SectorRiskSummary(BaseModel):
    sector: str
    risk_score: float
    top_disease: Optional[str]
    report_count_7d: int
    trend: str

class CityHeatmapResponse(BaseModel):
    city: str
    sectors: List[SectorRiskSummary]
    generated_at: datetime
