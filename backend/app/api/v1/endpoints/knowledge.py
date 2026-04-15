from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas import knowledge as schemas
from app.models.medical_knowledge import MedicalKnowledge
from app.services.knowledge_service import KnowledgeService
from sqlalchemy import select

router = APIRouter()

@router.post("/", response_model=schemas.MedicalKnowledge)
async def create_knowledge(
    *,
    db: AsyncSession = Depends(get_db),
    knowledge_in: schemas.MedicalKnowledgeCreate,
    background_tasks: BackgroundTasks
):
    """
    Create new medical knowledge and trigger embedding generation in the background.
    """
    db_obj = MedicalKnowledge(
        title=knowledge_in.title,
        content=knowledge_in.content,
        source=knowledge_in.source,
        disease_tags=knowledge_in.disease_tags
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # Trigger vector embedding generation in the background
    background_tasks.add_task(KnowledgeService.generate_embedding, db_obj.id)
    
    return db_obj

@router.get("/", response_model=List[schemas.MedicalKnowledge])
async def read_knowledge(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Retrieve medical knowledge entries.
    """
    result = await db.execute(select(MedicalKnowledge).offset(skip).limit(limit))
    return result.scalars().all()
