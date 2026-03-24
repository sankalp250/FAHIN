from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class AlertLogResponse(BaseModel):
    id: uuid.UUID
    city_sector: str
    disease: str
    alert_type: str
    message: Optional[str]
    sent_at: datetime
    delivery_status: str
    model_config = {"from_attributes": True}
