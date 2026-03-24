import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class HospitalStat(Base):
    __tablename__ = "hospital_stats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    stat_date: Mapped[date] = mapped_column(Date, nullable=False)
    disease_category: Mapped[str] = mapped_column(String(100), nullable=False)
    new_admissions: Mapped[int] = mapped_column(Integer, default=0)
    total_active_cases: Mapped[int] = mapped_column(Integer, default=0)
    icu_occupied: Mapped[int] = mapped_column(Integer, default=0)
    discharged_today: Mapped[int] = mapped_column(Integer, default=0)
    city_sector: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
