"""Pharmacy medicine sales endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date, timedelta

from app.db.session import get_db
from app.schemas.pharmacy import MedicineSaleCreate, MedicineSaleResponse
from app.models.medicine_sale import MedicineSale
from app.core.auth import get_current_user, require_role

router = APIRouter()


@router.post("/pharmacy/sales", response_model=MedicineSaleResponse, status_code=status.HTTP_201_CREATED)
async def submit_sales(
    sale: MedicineSaleCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("pharmacist", "city_admin")),
):
    # Compute 30-day baseline
    cutoff = sale.sale_date - timedelta(days=30)
    baseline_result = await db.execute(
        select(func.avg(MedicineSale.quantity_sold))
        .where(and_(
            MedicineSale.city_sector == sale.city_sector,
            MedicineSale.medicine_name == sale.medicine_name,
            MedicineSale.sale_date >= cutoff,
            MedicineSale.sale_date < sale.sale_date,
        ))
    )
    baseline = baseline_result.scalar_one_or_none() or 0
    deviation = (sale.quantity_sold - baseline) / max(baseline, 1)

    db_sale = MedicineSale(
        pharmacy_id=current_user.id,
        **sale.model_dump(),
        baseline_avg_30d=float(baseline),
        deviation_score=float(deviation),
    )
    db.add(db_sale)
    await db.commit()
    await db.refresh(db_sale)
    return db_sale


@router.get("/pharmacy/spikes")
async def get_medicine_spikes(city: str = "Gurugram", days: int = 7, db: AsyncSession = Depends(get_db)):
    cutoff = date.today() - timedelta(days=days)
    result = await db.execute(
        select(MedicineSale)
        .where(and_(MedicineSale.city == city, MedicineSale.sale_date >= cutoff,
                    MedicineSale.deviation_score >= 1.5))
        .order_by(MedicineSale.deviation_score.desc())
        .limit(20)
    )
    return result.scalars().all()
