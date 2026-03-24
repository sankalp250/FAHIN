"""Hospital stats endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.hospitals import HospitalStatCreate, HospitalStatResponse
from app.models.hospital_stat import HospitalStat
from app.core.auth import require_role

router = APIRouter()


@router.post("/hospitals/stats", response_model=HospitalStatResponse, status_code=status.HTTP_201_CREATED)
async def submit_hospital_stats(
    stat: HospitalStatCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("hospital_admin", "city_admin")),
):
    db_stat = HospitalStat(hospital_id=current_user.id, **stat.model_dump())
    db.add(db_stat)
    await db.commit()
    await db.refresh(db_stat)
    return db_stat
