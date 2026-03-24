from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import uuid

class HospitalStatCreate(BaseModel):
    stat_date: date
    disease_category: str
    new_admissions: int = 0
    total_active_cases: int = 0
    icu_occupied: int = 0
    discharged_today: int = 0
    city_sector: str
    city: str

class HospitalStatResponse(BaseModel):
    id: uuid.UUID
    stat_date: date
    disease_category: str
    new_admissions: int
    total_active_cases: int
    city_sector: str
    created_at: datetime
    model_config = {"from_attributes": True}
