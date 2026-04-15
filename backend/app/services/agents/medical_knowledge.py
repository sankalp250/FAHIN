"""Medical Knowledge Agent — RAG search over WHO/CDC documents."""
import logging
from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.services.ml.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

DISEASE_KNOWLEDGE = {
    "Dengue": "Dengue is a mosquito-borne viral infection. Key symptoms: high fever, severe headache, pain behind the eyes, joint/muscle pain, rash. Spreads via Aedes aegypti mosquito.",
    "Influenza": "Influenza (flu) spreads via respiratory droplets. Symptoms: fever, cough, sore throat, body aches, headache.",
    "Malaria": "Malaria is caused by Plasmodium parasites via Anopheles mosquito bite. Symptoms: cyclical fever, chills, sweating, headache.",
    "Typhoid": "Typhoid fever is caused by Salmonella typhi. Spreads via contaminated water/food. Symptoms: sustained fever, headache, abdominal pain.",
    "Unknown": "Unusual symptom cluster detected. Manual review recommended.",
}


class MedicalKnowledgeAgent:
    def __init__(self, llm: ChatGoogleGenerativeAI):
        self.llm = llm

    async def retrieve_evidence(
        self,
        disease_candidates: list[str],
        symptoms: list[str],
        env_context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        RAG pipeline:
        1. Embed symptoms.
        2. Vector search in medical_knowledge table.
        3. Augment LLM prompt with findings.
        """
        knowledge_snippets = []
        
        # 1. Try Vector Search (RAG)
        try:
            embedding = ModelRegistry.embed_symptoms(symptoms)
            if embedding:
                async with AsyncSessionLocal() as db:
                    # Semantic search using cosine similarity
                    query = text("""
                        SELECT title, content, source
                        FROM medical_knowledge
                        ORDER BY embedding <=> :embedding
                        LIMIT 3
                    """)
                    result = await db.execute(query, {"embedding": str(embedding)})
                    for row in result:
                        knowledge_snippets.append(f"[{row[2]}] {row[0]}: {row[1]}")
        except Exception as e:
            logger.warning(f"Vector search failed (check pgvector): {e}")

        # 2. Fallback to hardcoded knowledge if RAG empty
        if not knowledge_snippets:
            for disease in disease_candidates:
                kb_entry = DISEASE_KNOWLEDGE.get(disease, DISEASE_KNOWLEDGE["Unknown"])
                knowledge_snippets.append(f"Local Knowledge - {disease}: {kb_entry}")

        symptom_str = ", ".join(symptoms)
        env_str = f"AQI={env_context.get('aqi','?')}, humidity={env_context.get('humidity','?')}%, temp={env_context.get('temperature','?')}°C"
        knowledge_str = "\n\n".join(knowledge_snippets)

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=(
                    "You are an epidemiologist AI. Given symptoms, environment, and retrieved medical knowledge, "
                    "confirm which diseases are most likely and provide reasoning. "
                    "Return ONLY valid JSON: {'confirmed_diseases': [...], 'reasoning': '...'}"
                )),
                HumanMessage(content=f"Symptoms: {symptom_str}\nEnvironment: {env_str}\nKnowledge:\n{knowledge_str}"),
            ])
            import json
            data = json.loads(response.content)
            return {
                "evidence": knowledge_snippets,
                "confirmed_diseases": data.get("confirmed_diseases", disease_candidates),
                "reasoning": data.get("reasoning", "")
            }
        except Exception as e:
            logger.warning(f"MedicalKnowledge LLM failed: {e}")
            return {"evidence": knowledge_snippets, "confirmed_diseases": disease_candidates}
