from sqlalchemy import Column, String, Text, ARRAY, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.session import Base
import uuid

class MedicalKnowledge(Base):
    __tablename__ = "medical_knowledge"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String)
    disease_tags = Column(ARRAY(String))
    embedding = Column(Vector(768)) # BioBERT embedding dimension
    created_at = Column(DateTime(timezone=True), server_default=func.now())
