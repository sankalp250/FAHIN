from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class FederatedUpdateCreate(BaseModel):
    round_number: int
    model_type: str
    weight_storage_key: Optional[str] = None
    num_samples_trained: Optional[int] = None
    local_loss: Optional[float] = None
    local_accuracy: Optional[float] = None
    dp_noise_added: bool = False
    epsilon_budget_used: Optional[float] = None

class FederatedUpdateResponse(BaseModel):
    id: uuid.UUID
    round_number: int
    model_type: str
    aggregated: bool
    submitted_at: datetime
    model_config = {"from_attributes": True}
