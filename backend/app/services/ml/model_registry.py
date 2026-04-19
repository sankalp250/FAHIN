import logging
import torch
import joblib
import json
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelRegistry:
    _models = {}
    _is_loaded = False
    
    # Preservation Paths
    CORE_ML_PATH = Path("ml/models")
    USER_ML_PATH = Path("fahin_trained_models")

    @classmethod
    def load_all_models(cls):
        """Loads all preserved ML models into memory."""
        try:
            logger.info("Loading preserved ML models...")
            
            # 1. Symptom Embedding (Transformer)
            # cls._models["embedding"] = ... 
            
            # 2. Disease Classifier (XGBoost)
            # cls._models["classifier"] = joblib.load(cls.CORE_ML_PATH / "disease_classifier/model.pkl")
            
            # 3. Anomaly Detector (PyTorch Autoencoder)
            # cls._models["anomaly"] = ...
            
            cls._is_loaded = True
            logger.info("All models loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            cls._is_loaded = False

    @classmethod
    def get_model(cls, name: str):
        return cls._models.get(name)

    @classmethod
    def is_loaded(cls):
        return cls._is_loaded

# For now, we'll keep the actual loading commented or minimal until we verify paths
# but the structure is ready.

model_registry = ModelRegistry()
