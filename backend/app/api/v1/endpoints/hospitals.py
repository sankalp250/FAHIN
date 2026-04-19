from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import get_db
from app.models.v3_models import Hospital, SystemConfig
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

router = APIRouter()

class HospitalCreate(BaseModel):
    name: str
    sector: str
    city: Optional[str] = "Kolkata"
    icu_beds_total: Optional[int] = 50
    phone: Optional[str] = ""

class HospitalUpdate(BaseModel):
    icu_beds_available: Optional[int]
    oxygen_status: Optional[float]

@router.get("/", response_model=List[dict])
async def get_hospitals(db: AsyncSession = Depends(get_db)):
    # Get active city from config
    stmt_config = select(SystemConfig).limit(1)
    res_config = await db.execute(stmt_config)
    config = res_config.scalar_one_or_none()
    city = config.active_city if config else "Kolkata"

    stmt = select(Hospital).where(Hospital.city == city)
    result = await db.execute(stmt)
    hospitals = result.scalars().all()
    
    return [
        {
            "id": str(h.id),
            "name": h.name,
            "sector": h.sector,
            "icu_beds_total": h.icu_beds_total,
            "icu_beds_available": h.icu_beds_available,
            "oxygen_status": h.oxygen_status,
            "phone": h.phone,
            "last_updated": h.last_updated.strftime("%Y-%m-%d %H:%M")
        } for h in hospitals
    ]

@router.post("/add")
async def add_hospital(hospital: HospitalCreate, db: AsyncSession = Depends(get_db)):
    new_h = Hospital(
        name=hospital.name,
        sector=hospital.sector,
        city=hospital.city,
        icu_beds_total=hospital.icu_beds_total,
        icu_beds_available=hospital.icu_beds_total, # Default available = total
        phone=hospital.phone
    )
    db.add(new_h)
    await db.commit()
    await db.refresh(new_h)
    return new_h

@router.patch("/update/{hospital_id}")
async def update_hospital_status(hospital_id: UUID, status: HospitalUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Hospital).where(Hospital.id == hospital_id)
    result = await db.execute(stmt)
    h = result.scalar_one_or_none()
    
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    if status.icu_beds_available is not None:
        h.icu_beds_available = status.icu_beds_available
    if status.oxygen_status is not None:
        h.oxygen_status = status.oxygen_status
        
    await db.commit()
    return {"status": "success", "hospital": h.name}

@router.delete("/{hospital_id}")
async def delete_hospital(hospital_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = delete(Hospital).where(Hospital.id == hospital_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "deleted"}
