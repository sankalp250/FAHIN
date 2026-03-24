"""Disease classifier inference wrapper."""
import logging
import numpy as np
from typing import Optional
from app.services.ml.model_registry import ModelRegistry, SYMPTOMS

logger = logging.getLogger(__name__)


def symptoms_to_vector(symptoms: list[str]) -> np.ndarray:
    """Convert symptom list to binary feature vector matching training format."""
    vec = np.zeros(len(SYMPTOMS))
    for s in symptoms:
        s_clean = s.strip().lower().replace(" ", "_")
        if s_clean in SYMPTOMS:
            vec[SYMPTOMS.index(s_clean)] = 1.0
    return vec


def classify_disease(symptoms: list[str], aqi: Optional[float] = None,
                     temp: Optional[float] = None, humidity: Optional[float] = None) -> dict:
    """
    Run disease classification.
    Returns top-5 disease predictions with confidence scores.
    """
    if not symptoms:
        return {"predictions": [], "top_disease": "Unknown", "top_confidence": 0.0}

    vec = symptoms_to_vector(symptoms)
    result = ModelRegistry.predict_disease(vec.tolist())
    predictions = result.get("predictions", [])

    if not predictions:
        # Heuristic fallback when model not loaded
        predictions = _heuristic_classify(symptoms)

    top = predictions[0] if predictions else {"disease": "Unknown", "probability": 0.0}
    return {
        "predictions": predictions,
        "top_disease": top["disease"],
        "top_confidence": top["probability"],
    }


def _heuristic_classify(symptoms: list[str]) -> list[dict]:
    """Simple rule-based fallback before model is trained."""
    syms = set(s.lower() for s in symptoms)

    dengue_syms   = {"fever","joint_pain","headache","rash","pain_behind_the_eyes"}
    flu_syms      = {"fever","cough","sore_throat","body_aches","fatigue"}
    malaria_syms  = {"fever","chills","sweating","headache","nausea"}
    typhoid_syms  = {"fever","abdominal_pain","headache","loss_of_appetite"}

    scores = [
        ("Dengue",    len(syms & dengue_syms)  / len(dengue_syms)),
        ("Influenza", len(syms & flu_syms)     / len(flu_syms)),
        ("Malaria",   len(syms & malaria_syms) / len(malaria_syms)),
        ("Typhoid",   len(syms & typhoid_syms) / len(typhoid_syms)),
    ]
    scores.sort(key=lambda x: x[1], reverse=True)
    total = sum(s for _, s in scores) or 1
    return [{"disease": d, "probability": round(s / total, 3)} for d, s in scores]
