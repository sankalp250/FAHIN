import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ARRAY, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class PrescriptionRecord(Base):
    __tablename__ = "prescription_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    extracted_symptoms: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    extracted_disease: Mapped[str | None] = mapped_column(String(100))
    extracted_medicines: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    city_sector: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    ocr_confidence: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
