"""
FAHIN — LangChain Agent Orchestrator
Uses LangGraph to chain 5 agents in a directed workflow.
"""

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Optional
import logging
import asyncio

from app.core.config import settings
from app.services.agents.privacy_guardian import PrivacyGuardianAgent
from app.services.agents.symptom_intelligence import SymptomIntelligenceAgent
from app.services.agents.city_risk import CityRiskAgent
from app.services.agents.medical_knowledge import MedicalKnowledgeAgent
from app.services.agents.outbreak_prediction import OutbreakPredictionAgent
from app.services.agents.alert_agent import AlertAgent

logger = logging.getLogger(__name__)


# --- State Schema ---

class OutbreakDetectionState(TypedDict):
    """Shared state passed between agents in the LangGraph workflow."""
    # Input
    report_id: str
    sector: str
    city: str
    raw_symptoms: List[str]
    
    # After Privacy Guardian
    cleaned_symptoms: List[str]
    
    # After Symptom Intelligence
    symptom_clusters: List[dict]
    similar_disease_candidates: List[str]
    symptom_embedding: Optional[List[float]]
    
    # After City Risk Agent
    aqi: Optional[float]
    humidity: Optional[float]
    temperature: Optional[float]
    env_risk_score: Optional[float]
    
    # After Medical Knowledge Agent
    medical_evidence: List[str]
    confirmed_disease_hypotheses: List[str]
    
    # After Outbreak Prediction Agent
    outbreak_probability: float
    predicted_disease: str
    predicted_peak_days: Optional[int]
    anomaly_detected: bool
    classifier_score: float
    forecast_score: float
    anomaly_score: float
    
    # Final
    alert_sent: bool
    error: Optional[str]


# --- Instantiate Agents ---

llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    api_key=settings.OPENAI_API_KEY,
    temperature=0.1,  # Low temperature for medical reasoning
)

privacy_guardian = PrivacyGuardianAgent()
symptom_intelligence = SymptomIntelligenceAgent(llm=llm)
city_risk = CityRiskAgent()
medical_knowledge = MedicalKnowledgeAgent(llm=llm)
outbreak_prediction = OutbreakPredictionAgent()
alert_agent = AlertAgent()


# --- Graph Nodes ---

async def run_privacy_guardian(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """Strip any PII from symptom data."""
    logger.info(f"[Privacy Guardian] Processing report {state['report_id']}")
    try:
        cleaned = privacy_guardian.clean_symptoms(state["raw_symptoms"])
        state["cleaned_symptoms"] = cleaned
    except Exception as e:
        logger.error(f"Privacy Guardian failed: {e}")
        state["cleaned_symptoms"] = state["raw_symptoms"]  # fail-open (symptoms aren't PII)
    return state


async def run_symptom_intelligence(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """Analyse symptom patterns and generate embedding."""
    logger.info(f"[Symptom Intelligence] Analysing sector {state['sector']}")
    try:
        result = await symptom_intelligence.analyze(
            symptoms=state["cleaned_symptoms"],
            sector=state["sector"],
            city=state["city"],
        )
        state["symptom_clusters"] = result["clusters"]
        state["similar_disease_candidates"] = result["candidates"]
        state["symptom_embedding"] = result["embedding"]
    except Exception as e:
        logger.error(f"Symptom Intelligence Agent failed: {e}")
        state["error"] = str(e)
    return state


async def run_city_risk(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """Fetch environmental data for the sector."""
    logger.info(f"[City Risk] Fetching env data for {state['sector']}, {state['city']}")
    try:
        env_data = await city_risk.get_risk_factors(
            sector=state["sector"],
            city=state["city"],
        )
        state.update(env_data)
    except Exception as e:
        logger.warning(f"City Risk Agent failed (non-fatal): {e}")
        state["env_risk_score"] = 0.5  # neutral fallback
    return state


async def run_medical_knowledge(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """RAG search for medical evidence supporting disease hypotheses."""
    logger.info(f"[Medical Knowledge] Searching for {state['similar_disease_candidates']}")
    try:
        result = await medical_knowledge.retrieve_evidence(
            disease_candidates=state["similar_disease_candidates"],
            symptoms=state["cleaned_symptoms"],
            env_context={
                "aqi": state.get("aqi"),
                "humidity": state.get("humidity"),
                "temperature": state.get("temperature"),
            }
        )
        state["medical_evidence"] = result["evidence"]
        state["confirmed_disease_hypotheses"] = result["confirmed_diseases"]
    except Exception as e:
        logger.error(f"Medical Knowledge Agent failed: {e}")
        state["confirmed_disease_hypotheses"] = state["similar_disease_candidates"]
    return state


async def run_outbreak_prediction(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """Run all ML models and compute outbreak probability."""
    logger.info(f"[Outbreak Prediction] Running models for {state['sector']}")
    try:
        result = await outbreak_prediction.predict(
            sector=state["sector"],
            city=state["city"],
            disease_hypotheses=state["confirmed_disease_hypotheses"],
            symptom_embedding=state["symptom_embedding"],
            env_risk_score=state.get("env_risk_score", 0.5),
        )
        state.update(result)
    except Exception as e:
        logger.error(f"Outbreak Prediction Agent failed: {e}")
        state["outbreak_probability"] = 0.0
        state["anomaly_detected"] = False
    return state


async def run_alert_agent(state: OutbreakDetectionState) -> OutbreakDetectionState:
    """Send alerts to hospitals and update dashboard."""
    logger.info(f"[Alert Agent] Sending alerts for {state['predicted_disease']} in {state['sector']}")
    try:
        await alert_agent.send_alerts(
            sector=state["sector"],
            city=state["city"],
            disease=state["predicted_disease"],
            probability=state["outbreak_probability"],
            peak_days=state.get("predicted_peak_days"),
        )
        state["alert_sent"] = True
    except Exception as e:
        logger.error(f"Alert Agent failed: {e}")
        state["alert_sent"] = False
    return state


# --- Conditional Edge ---

def should_send_alert(state: OutbreakDetectionState) -> str:
    """Decide whether to trigger alerts based on outbreak probability."""
    prob = state.get("outbreak_probability", 0.0)
    anomaly = state.get("anomaly_detected", False)
    
    if prob >= settings.OUTBREAK_ALERT_THRESHOLD or anomaly:
        logger.info(f"Alert threshold met: probability={prob:.2f}, anomaly={anomaly}")
        return "send_alert"
    else:
        logger.info(f"No alert: probability={prob:.2f} below threshold")
        return "no_alert"


# --- Build LangGraph ---

def build_workflow() -> StateGraph:
    workflow = StateGraph(OutbreakDetectionState)
    
    workflow.add_node("privacy_guardian", run_privacy_guardian)
    workflow.add_node("symptom_intelligence", run_symptom_intelligence)
    workflow.add_node("city_risk", run_city_risk)
    workflow.add_node("medical_knowledge", run_medical_knowledge)
    workflow.add_node("outbreak_prediction", run_outbreak_prediction)
    workflow.add_node("alert", run_alert_agent)
    
    workflow.set_entry_point("privacy_guardian")
    workflow.add_edge("privacy_guardian", "symptom_intelligence")
    workflow.add_edge("symptom_intelligence", "city_risk")
    workflow.add_edge("city_risk", "medical_knowledge")
    workflow.add_edge("medical_knowledge", "outbreak_prediction")
    
    workflow.add_conditional_edges(
        "outbreak_prediction",
        should_send_alert,
        {
            "send_alert": "alert",
            "no_alert": END,
        }
    )
    workflow.add_edge("alert", END)
    
    return workflow.compile()


# Compiled workflow (singleton)
_workflow = None

def get_workflow():
    global _workflow
    if _workflow is None:
        _workflow = build_workflow()
    return _workflow


# --- Public Interface ---

async def process_symptom_report(report_id: str, sector: str, city: str):
    """
    Entry point called by FastAPI background task.
    Loads report from DB and runs the full agent pipeline.
    """
    from app.db.session import AsyncSessionLocal
    from app.models.symptom_report import SymptomReport
    from sqlalchemy import select
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SymptomReport).where(SymptomReport.id == report_id)
        )
        report = result.scalar_one_or_none()
        
        if not report:
            logger.error(f"Report {report_id} not found for agent processing")
            return
    
    initial_state: OutbreakDetectionState = {
        "report_id": report_id,
        "sector": sector,
        "city": city,
        "raw_symptoms": report.symptoms,
        "cleaned_symptoms": [],
        "symptom_clusters": [],
        "similar_disease_candidates": [],
        "symptom_embedding": None,
        "aqi": None,
        "humidity": None,
        "temperature": None,
        "env_risk_score": None,
        "medical_evidence": [],
        "confirmed_disease_hypotheses": [],
        "outbreak_probability": 0.0,
        "predicted_disease": "unknown",
        "predicted_peak_days": None,
        "anomaly_detected": False,
        "classifier_score": 0.0,
        "forecast_score": 0.0,
        "anomaly_score": 0.0,
        "alert_sent": False,
        "error": None,
    }
    
    workflow = get_workflow()
    final_state = await workflow.ainvoke(initial_state)
    
    logger.info(
        f"Agent pipeline complete for {report_id}: "
        f"disease={final_state['predicted_disease']}, "
        f"probability={final_state['outbreak_probability']:.2f}, "
        f"alert_sent={final_state['alert_sent']}"
    )
    
    return final_state
