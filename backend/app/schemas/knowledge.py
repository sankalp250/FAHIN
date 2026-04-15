from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class MedicalKnowledgeBase(BaseModel):
    title: str
    content: str
    source: Optional[str] = None
    disease_tags: Optional[List[str]] = []

class MedicalKnowledgeCreate(MedicalKnowledgeBase):
    pass

class MedicalKnowledge(MedicalKnowledgeBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
