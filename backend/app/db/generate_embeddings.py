"""
FAHIN — Knowledge Base Embedding Generator
Generates BioBERT embeddings for seeded medical knowledge.
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path("d:/Downloads/FAHIN_v2_complete/FAHIN/backend").absolute()))

from app.db.session import AsyncSessionLocal
from app.services.ml.model_registry import ModelRegistry
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def generate_knowledge_embeddings():
    # 1. Ensure models are loaded
    print("Loading ML models (BioBERT)...")
    ModelRegistry.load_all_models()
    
    async with AsyncSessionLocal() as db:
        print("Fetching knowledge entries without embeddings...")
        # Get entries that need embeddings (or all if we want to refresh)
        result = await db.execute(text("SELECT id, title, content FROM medical_knowledge WHERE embedding IS NULL"))
        rows = result.fetchall()
        
        if not rows:
            print("No entries found requiring embeddings.")
            return

        print(f"Processing {len(rows)} entries...")
        
        for row in rows:
            entry_id, title, content = row
            text_to_embed = f"{title}. {content}"
            
            # Generate embedding using our Symptom Embedder (BioBERT 768-dim)
            # We use the same model as symptoms so they are in the same latent space
            # Note: embed expects a list of symptoms, but it just joins them with commas.
            # We can pass the content as a single-element list.
            try:
                embedding = ModelRegistry.embed_symptoms([text_to_embed])
                
                if embedding:
                    await db.execute(
                        text("UPDATE medical_knowledge SET embedding = :emb WHERE id = :id"),
                        {"emb": str(embedding), "id": entry_id}
                    )
                    print(f"[DONE] Generated embedding for: {title}")
            except Exception as e:
                print(f"[ERROR] Failed to embed '{title}': {e}")
        
        await db.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(generate_knowledge_embeddings())
