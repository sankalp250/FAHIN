import uuid
from datetime import datetime
from sqlalchemy import String, Float, SmallInteger, Boolean, DateTime, ARRAY, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

from pgvector.sqlalchemy import Vector

class SymptomReport(Base):
    __tablename__ = "f_symptom_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    symptoms: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(768))
    severity: Mapped[int | None] = mapped_column(SmallInteger)
    duration_days: Mapped[int | None] = mapped_column(SmallInteger)
    city_sector: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    reported_aqi: Mapped[float | None] = mapped_column(Float)
    reported_temp_c: Mapped[float | None] = mapped_column(Float)
    reported_humidity: Mapped[float | None] = mapped_column(Float)
    predicted_disease: Mapped[str | None] = mapped_column(String(100))
    prediction_confidence: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(20), default="mobile")
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
