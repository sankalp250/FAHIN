from pydantic import BaseModel
import uuid

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: uuid.UUID
    role: str
    city_sector: str | None
    city: str
    model_config = {"from_attributes": True}
