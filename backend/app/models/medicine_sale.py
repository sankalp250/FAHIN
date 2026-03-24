import uuid
from datetime import datetime, date
from sqlalchemy import String, Float, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class MedicineSale(Base):
    __tablename__ = "medicine_sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pharmacy_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    medicine_name: Mapped[str] = mapped_column(String(200), nullable=False)
    medicine_category: Mapped[str | None] = mapped_column(String(50))
    quantity_sold: Mapped[int] = mapped_column(Integer, nullable=False)
    sale_date: Mapped[date] = mapped_column(Date, nullable=False)
    city_sector: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    baseline_avg_30d: Mapped[float | None] = mapped_column(Float)
    deviation_score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
