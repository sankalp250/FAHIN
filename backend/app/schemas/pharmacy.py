from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
import uuid

class MedicineSaleCreate(BaseModel):
    medicine_name: str = Field(..., max_length=200)
    medicine_category: Optional[str] = None
    quantity_sold: int = Field(..., ge=0)
    sale_date: date
    city_sector: str
    city: str

class MedicineSaleResponse(BaseModel):
    id: uuid.UUID
    medicine_name: str
    quantity_sold: int
    sale_date: date
    baseline_avg_30d: Optional[float]
    deviation_score: Optional[float]
    created_at: datetime
    model_config = {"from_attributes": True}
