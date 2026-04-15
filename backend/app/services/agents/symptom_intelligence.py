"""Symptom Intelligence Agent — embeds symptoms and finds disease candidates."""
import logging
from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.ml.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class SymptomIntelligenceAgent:
    def __init__(self, llm: ChatGoogleGenerativeAI):
        self.llm = llm

    async def analyze(self, symptoms: list[str], sector: str, city: str) -> dict[str, Any]:
        symptom_text = ", ".join(symptoms) if symptoms else "none"
        
        # 1. Generate Embedding (BioBERT)
        embedding = None
        if symptoms:
            try:
                embedding = ModelRegistry.embed_symptoms(symptoms)
            except Exception as e:
                logger.warning(f"Symptom embedding failed: {e}")

        # 2. Get Candidates & Clusters (Gemini)
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=(
                    "You are a medical AI. Given symptoms, return a JSON object with: "
                    "'candidates' (top 3 disease names as array), "
                    "'clusters' (symptom groupings as array of objects with 'name' and 'symptoms'). "
                    "Return ONLY valid JSON, no markdown."
                )),
                HumanMessage(content=f"Symptoms: {symptom_text}"),
            ])
            import json
            data = json.loads(response.content)
            return {
                "candidates": data.get("candidates", ["Unknown"]),
                "clusters": data.get("clusters", []),
                "embedding": embedding,
            }
        except Exception as e:
            logger.warning(f"SymptomIntelligence LLM call failed: {e}")
            return {"candidates": ["Unknown"], "clusters": [], "embedding": embedding}
