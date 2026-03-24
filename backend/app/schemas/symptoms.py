from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class SymptomReportCreate(BaseModel):
    symptoms: List[str] = Field(..., min_length=1, max_length=20, description="List of symptom strings")
    severity: Optional[int] = Field(None, ge=1, le=10)
    duration_days: Optional[int] = Field(None, ge=1, le=365)
    city_sector: str = Field(..., max_length=50)
    city: str = Field(..., max_length=100)
    reported_aqi: Optional[float] = None
    reported_temp_c: Optional[float] = None
    reported_humidity: Optional[float] = None
    source: Optional[str] = "mobile"

class SymptomReportResponse(BaseModel):
    id: uuid.UUID
    symptoms: List[str]
    severity: Optional[int]
    city_sector: str
    city: str
    predicted_disease: Optional[str]
    prediction_confidence: Optional[float]
    is_processed: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class SectorTrend(BaseModel):
    city_sector: str
    report_date: str
    total_reports: int
    predicted_disease: Optional[str]
    avg_confidence: Optional[float]
