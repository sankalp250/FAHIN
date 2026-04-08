import uuid
from datetime import datetime, date
from sqlalchemy import String, Float, SmallInteger, Boolean, DateTime, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class OutbreakPrediction(Base):
    __tablename__ = "f_outbreak_predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_sector: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    disease: Mapped[str] = mapped_column(String(100), nullable=False)
    prediction_date: Mapped[date] = mapped_column(Date, nullable=False)
    predicted_peak_date: Mapped[date | None] = mapped_column(Date)
    days_until_peak: Mapped[int | None] = mapped_column(SmallInteger)
    probability: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_low: Mapped[float | None] = mapped_column(Float)
    confidence_interval_high: Mapped[float | None] = mapped_column(Float)
    classifier_score: Mapped[float | None] = mapped_column(Float)
    forecast_score: Mapped[float | None] = mapped_column(Float)
    anomaly_score: Mapped[float | None] = mapped_column(Float)
    symptom_report_count: Mapped[int | None] = mapped_column(Integer)
    pharmacy_spike_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    hospital_admission_spike: Mapped[bool] = mapped_column(Boolean, default=False)
    env_risk_factor: Mapped[float | None] = mapped_column(Float)
    alert_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    alert_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    outcome: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
