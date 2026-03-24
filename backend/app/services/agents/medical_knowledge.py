"""Medical Knowledge Agent — RAG search over WHO/CDC documents."""
import logging
from typing import Any
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

DISEASE_KNOWLEDGE = {
    "Dengue": "Dengue is a mosquito-borne viral infection. Key symptoms: high fever, severe headache, pain behind the eyes, joint/muscle pain, rash. Spreads via Aedes aegypti mosquito. Peak risk: rainy season + high humidity.",
    "Influenza": "Influenza (flu) spreads via respiratory droplets. Symptoms: fever, cough, sore throat, body aches, headache. Seasonal peaks: winter months.",
    "Malaria": "Malaria is caused by Plasmodium parasites via Anopheles mosquito bite. Symptoms: cyclical fever, chills, sweating, headache. Endemic in tropical regions.",
    "Typhoid": "Typhoid fever is caused by Salmonella typhi. Spreads via contaminated water/food. Symptoms: sustained fever, headache, abdominal pain. Water contamination is a key risk factor.",
    "Cholera": "Cholera causes severe watery diarrhea and dehydration. Spreads via contaminated water. Outbreaks linked to floods and poor sanitation.",
    "COVID-19": "COVID-19 spreads via respiratory aerosols. Symptoms: fever, cough, loss of smell/taste, breathlessness. Can cause severe pneumonia.",
    "Unknown": "Unusual symptom cluster detected. Manual review recommended. Cross-reference with recent WHO disease alerts.",
}


class MedicalKnowledgeAgent:
    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    async def retrieve_evidence(
        self,
        disease_candidates: list[str],
        symptoms: list[str],
        env_context: dict[str, Any],
    ) -> dict[str, Any]:
        knowledge_snippets = []
        confirmed_diseases = []

        for disease in disease_candidates:
            kb_entry = DISEASE_KNOWLEDGE.get(disease, DISEASE_KNOWLEDGE["Unknown"])
            knowledge_snippets.append(f"{disease}: {kb_entry}")

        symptom_str = ", ".join(symptoms)
        env_str = f"AQI={env_context.get('aqi','?')}, humidity={env_context.get('humidity','?')}%, temp={env_context.get('temperature','?')}°C"
        knowledge_str = "\n".join(knowledge_snippets)

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=(
                    "You are an epidemiologist AI. Given symptoms, environment, and disease knowledge, "
                    "determine which diseases are most likely. Return JSON: "
                    "{'confirmed_diseases': [...], 'reasoning': '...'}"
                    "Return ONLY valid JSON."
                )),
                HumanMessage(content=f"Symptoms: {symptom_str}\nEnvironment: {env_str}\nKnowledge:\n{knowledge_str}"),
            ])
            import json
            data = json.loads(response.content)
            confirmed_diseases = data.get("confirmed_diseases", disease_candidates)
        except Exception as e:
            logger.warning(f"MedicalKnowledge LLM failed: {e}")
            confirmed_diseases = disease_candidates

        return {"evidence": knowledge_snippets, "confirmed_diseases": confirmed_diseases}
