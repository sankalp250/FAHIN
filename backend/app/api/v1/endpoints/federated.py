"""Federated learning endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.schemas.federated import FederatedUpdateCreate, FederatedUpdateResponse
from app.models.federated_update import FederatedUpdate
from app.core.auth import require_role

router = APIRouter()


@router.post("/federated/submit-weights", response_model=FederatedUpdateResponse, status_code=status.HTTP_201_CREATED)
async def submit_weights(
    update: FederatedUpdateCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("hospital_admin")),
):
    db_update = FederatedUpdate(hospital_id=current_user.id, **update.model_dump())
    db.add(db_update)
    await db.commit()
    await db.refresh(db_update)
    return db_update


@router.get("/federated/rounds/current")
async def get_current_round(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.max(FederatedUpdate.round_number)))
    current_round = result.scalar_one_or_none() or 0
    submitted = await db.execute(
        select(func.count()).select_from(FederatedUpdate)
        .where(FederatedUpdate.round_number == current_round)
    )
    return {
        "round_number": current_round,
        "model_type": "disease_classifier",
        "clients_submitted": submitted.scalar_one() or 0,
        "status": "in_progress",
    }
