"""Symptom Intelligence Agent — embeds symptoms and finds disease candidates."""
import logging
from typing import Any
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)


class SymptomIntelligenceAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    async def analyze(self, symptoms: list[str], sector: str, city: str) -> dict[str, Any]:
        symptom_text = ", ".join(symptoms) if symptoms else "none"
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
                "embedding": None,
            }
        except Exception as e:
            logger.warning(f"SymptomIntelligence LLM call failed: {e}")
            return {"candidates": ["Unknown"], "clusters": [], "embedding": None}
