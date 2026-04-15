"""
FAHIN — Knowledge Base Service
Handles medical knowledge ingestion and automated embedding generation.
"""
import logging
from uuid import UUID
from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.services.ml.model_registry import ModelRegistry
from app.models.medical_knowledge import MedicalKnowledge

logger = logging.getLogger(__name__)

class KnowledgeService:
    @staticmethod
    async def generate_embedding(entry_id: UUID):
        """Generates embedding for a specific medical knowledge entry."""
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("SELECT id, title, content FROM medical_knowledge WHERE id = :id"),
                {"id": entry_id}
            )
            row = result.fetchone()
            
            if not row:
                logger.error(f"Knowledge entry {entry_id} not found.")
                return

            entry_id, title, content = row
            text_to_embed = f"{title}. {content}"
            
            try:
                # Ensure models are loaded
                ModelRegistry.load_all_models()
                embedding = ModelRegistry.embed_symptoms([text_to_embed])
                
                if embedding:
                    await db.execute(
                        text("UPDATE medical_knowledge SET embedding = :emb WHERE id = :id"),
                        {"emb": str(embedding), "id": entry_id}
                    )
                    await db.commit()
                    logger.info(f"Successfully generated embedding for: {title}")
            except Exception as e:
                logger.error(f"Failed to generate embedding for '{title}': {e}")

    @staticmethod
    async def process_pending_embeddings():
        """Processes all entries that are missing embeddings."""
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("SELECT id FROM medical_knowledge WHERE embedding IS NULL")
            )
            rows = result.fetchall()
            
            for row in rows:
                await KnowledgeService.generate_embedding(row[0])
