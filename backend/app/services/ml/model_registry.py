"""
FAHIN — ML Model Registry
Loads and caches all 4 models at startup.
"""
import logging
import os
import joblib
import json
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.getenv("MODEL_DIR", "../ml/models"))


class ModelRegistry:
    """Singleton model store — loaded once at startup."""
    _disease_classifier = None
    _disease_scaler = None
    _disease_label_encoder = None
    _disease_metadata = None
    _models_loaded = False

    @classmethod
    def load_all_models(cls):
        if cls._models_loaded:
            return
        try:
            cls._load_disease_classifier()
        except Exception as e:
            logger.warning(f"Disease classifier not loaded (run training first): {e}")
        cls._models_loaded = True
        logger.info("ML Model Registry initialised.")

    @classmethod
    def _load_disease_classifier(cls):
        path = MODEL_DIR / "disease_classifier"
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
            return {"predictions": [{"disease": "Unknown", "probability": 0.5}]}
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
