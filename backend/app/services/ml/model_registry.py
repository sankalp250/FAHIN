"""
FAHIN — ML Model Registry
Loads and caches all 4 models at startup.
"""
import logging
import os
import joblib
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.services.ml.symptom_embedder import SymptomEmbedderService
from app.services.ml.outbreak_forecaster import OutbreakForecasterService
from app.services.ml.anomaly_detector import AnomalyDetectorService

logger = logging.getLogger(__name__)

# Base directory for models
MODEL_DIR = Path(os.getenv("MODEL_DIR", "../ml/models"))


class ModelRegistry:
    """Singleton model store — loaded once at startup."""
    
    # Model Instances
    _disease_classifier = None
    _disease_scaler = None
    _disease_label_encoder = None
    _disease_metadata = None
    
    _symptom_embedder: Optional[SymptomEmbedderService] = None
    _outbreak_forecaster: Optional[OutbreakForecasterService] = None
    _anomaly_detector: Optional[AnomalyDetectorService] = None
    
    _models_loaded = False

    @classmethod
    def load_all_models(cls):
        """Initialise all models from disk."""
        if cls._models_loaded:
            return
        
        # 1. Disease Classifier
        try:
            cls._load_disease_classifier()
        except Exception as e:
            logger.warning(f"Disease classifier not loaded: {e}")
            
        # 2. Symptom Embedder
        try:
            path = MODEL_DIR / "symptom_embedding"
            if path.exists():
                cls._symptom_embedder = SymptomEmbedderService(path)
            else:
                logger.warning("Symptom embedder path not found")
        except Exception as e:
            logger.warning(f"Symptom embedder not loaded: {e}")
            
        # 3. Outbreak Forecaster
        try:
            path = MODEL_DIR / "outbreak_forecast"
            if path.exists():
                cls._outbreak_forecaster = OutbreakForecasterService(path)
            else:
                logger.warning("Outbreak forecaster path not found")
        except Exception as e:
            logger.warning(f"Outbreak forecaster not loaded: {e}")
            
        # 4. Anomaly Detector
        try:
            path = MODEL_DIR / "anomaly_detection"
            if path.exists():
                cls._anomaly_detector = AnomalyDetectorService(path)
            else:
                logger.warning("Anomaly detector path not found")
        except Exception as e:
            logger.warning(f"Anomaly detector not loaded: {e}")

        cls._models_loaded = True
        logger.info("ML Model Registry initialised.")

    @classmethod
    def _load_disease_classifier(cls):
        path = MODEL_DIR / "disease_classifier"
        if not path.exists():
            raise FileNotFoundError(f"Model directory missing: {path}")
            
        cls._disease_classifier = joblib.load(path / "ensemble.pkl")
        cls._disease_scaler = joblib.load(path / "scaler.pkl")
        cls._disease_label_encoder = joblib.load(path / "label_encoder.pkl")
        with open(path / "metadata.json") as f:
            cls._disease_metadata = json.load(f)
        logger.info(f"Disease classifier loaded. Diseases: {len(cls._disease_metadata.get('diseases', []))}")

    @classmethod
    def predict_disease(cls, symptom_vector: list[float]) -> dict:
        """Run disease classification inference."""
        if cls._disease_classifier is None:
            return {"predictions": []}
        import numpy as np
        x = np.array(symptom_vector).reshape(1, -1)
        x_scaled = cls._disease_scaler.transform(x)
        proba = cls._disease_classifier.predict_proba(x_scaled)[0]
        top5_idx = proba.argsort()[-5:][::-1]
        diseases = cls._disease_label_encoder.classes_
        return {
            "predictions": [
                {"disease": diseases[i], "probability": float(proba[i])}
                for i in top5_idx
            ]
        }

    @classmethod
    def embed_symptoms(cls, symptoms: List[str]) -> Optional[List[float]]:
        """Generate vector embedding for symptoms."""
        if cls._symptom_embedder:
            return cls._symptom_embedder.embed(symptoms)
        return None

    @classmethod
    def forecast_outbreak(cls, history: List[List[float]]) -> Optional[List[float]]:
        """Forecast case counts for the next 7 days."""
        if cls._outbreak_forecaster:
            return cls._outbreak_forecaster.predict(history)
        return None

    @classmethod
    def detect_anomaly(cls, embedding: List[float]) -> Dict[str, Any]:
        """Detect if symptom pattern is anomalous (unknown disease)."""
        if cls._anomaly_detector:
            return cls._anomaly_detector.compute_anomaly_score(embedding)
        return {"anomaly_score": 0.0, "is_anomaly": False}

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._models_loaded

# Expose symptom list for inference wrappers
SYMPTOMS = [
    "itching","skin_rash","nodal_skin_eruptions","continuous_sneezing","shivering",
    "chills","joint_pain","stomach_pain","acidity","vomiting","fatigue","weight_loss",
    "anxiety","mood_swings","restlessness","lethargy","cough","high_fever","breathlessness",
    "sweating","dehydration","headache","nausea","loss_of_appetite","back_pain","diarrhoea",
    "mild_fever","yellow_urine","yellowing_of_eyes","acute_liver_failure","fluid_overload",
    "swelling_of_stomach","swelled_lymph_nodes","malaise","blurred_and_distorted_vision",
    "phlegm","throat_irritation","redness_of_eyes","sinus_pressure","runny_nose","congestion",
    "chest_pain","weakness_in_limbs","fast_heart_rate","pain_during_bowel_movements",
    "neck_pain","dizziness","cramps","bruising","obesity","swollen_legs","puffy_face_and_eyes",
    "enlarged_thyroid","brittle_nails","excessive_hunger","extra_marital_contacts",
    "drying_and_tingling_lips","slurred_speech","knee_pain","hip_joint_pain","muscle_weakness",
    "stiff_neck","swelling_joints","spinning_movements","loss_of_balance","unsteadiness",
    "weakness_of_one_body_side","loss_of_smell","bladder_discomfort","foul_smell_of_urine",
    "continuous_feel_of_urine","passage_of_gases","internal_itching","depression",
    "irritability","muscle_pain","red_spots_over_body","belly_pain","abnormal_menstruation",
    "watering_from_eyes","increased_appetite","polyuria","family_history","mucoid_sputum",
    "rusty_sputum","blood_in_sputum","palpitations","painful_walking","pus_filled_pimples",
    "blackheads","skin_peeling","inflammatory_nails","blister","yellow_crust_ooze",
    "body_aches","sore_throat",
]
