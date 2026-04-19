from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.db.session import get_db
from app.models.v3_models import SystemConfig, Sector
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

router = APIRouter()

class SectorCreate(BaseModel):
    name: str
    city: Optional[str] = "Kolkata"

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    stmt = select(SystemConfig).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    
    if not config:
        config = SystemConfig()
        db.add(config)
        await db.commit()
        await db.refresh(config)
    
    return config

@router.post("/update")
async def update_settings(update_data: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    stmt = select(SystemConfig).limit(1)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    
    if not config:
        config = SystemConfig()
        db.add(config)
    
    # Update fields dynamically
    for key, value in update_data.items():
        if hasattr(config, key):
            setattr(config, key, value)
            
    config.last_updated = datetime.utcnow()
    await db.commit()
    await db.refresh(config)
    return config

# Sector Management Endpoints
@router.get("/sectors")
async def get_sectors(city: str = "Kolkata", db: AsyncSession = Depends(get_db)):
    stmt = select(Sector).where(Sector.city == city)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/sectors/add")
async def add_sector(sector: SectorCreate, db: AsyncSession = Depends(get_db)):
    new_sector = Sector(name=sector.name, city=sector.city)
    db.add(new_sector)
    try:
        await db.commit()
        await db.refresh(new_sector)
        return new_sector
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Sector already exists or invalid data.")

@router.delete("/sectors/{sector_id}")
async def delete_sector(sector_id: int, db: AsyncSession = Depends(get_db)):
    stmt = delete(Sector).where(Sector.id == sector_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success"}
