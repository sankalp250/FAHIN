import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class FederatedUpdate(Base):
    __tablename__ = "f_federated_updates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)
    weight_storage_key: Mapped[str | None] = mapped_column(String(255))
    num_samples_trained: Mapped[int | None] = mapped_column(Integer)
    local_loss: Mapped[float | None] = mapped_column(Float)
    local_accuracy: Mapped[float | None] = mapped_column(Float)
    dp_noise_added: Mapped[bool] = mapped_column(Boolean, default=False)
    epsilon_budget_used: Mapped[float | None] = mapped_column(Float)
    aggregated: Mapped[bool] = mapped_column(Boolean, default=False)
    aggregated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
