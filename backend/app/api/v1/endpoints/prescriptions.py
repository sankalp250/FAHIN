"""Prescription upload + OCR endpoint."""
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.prescription_record import PrescriptionRecord
from app.core.auth import get_current_user

router = APIRouter()


@router.post("/prescriptions/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_prescription(
    background_tasks: BackgroundTasks,
    city_sector: str = Form(...),
    city: str = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    contents = await image.read()
    record = PrescriptionRecord(
        uploaded_by=current_user.id,
        city_sector=city_sector,
        city=city,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # Background OCR processing would go here
    # background_tasks.add_task(run_ocr, record_id=str(record.id), image_bytes=contents)

    return {"id": str(record.id), "status": "processing",
            "message": "Prescription received. OCR processing in background."}
