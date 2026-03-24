"""Autoencoder + Isolation Forest anomaly detection inference."""
import logging
import numpy as np
from pathlib import Path
import json
import os

logger = logging.getLogger(__name__)
MODEL_DIR = Path(os.getenv("MODEL_DIR", "../ml/models"))


class AnomalyDetector:
    _autoencoder = None
    _iso_forest = None
    _scaler = None
    _threshold: float = 0.05  # default, overridden from metadata

    @classmethod
    def load(cls):
        try:
            import joblib
            path = MODEL_DIR / "anomaly_detection"
            if (path / "isolation_forest.pkl").exists():
                cls._iso_forest = joblib.load(path / "isolation_forest.pkl")
                cls._scaler = joblib.load(path / "iso_scaler.pkl")
                logger.info("Isolation Forest anomaly detector loaded")
            if (path / "metadata.json").exists():
                with open(path / "metadata.json") as f:
                    meta = json.load(f)
                cls._threshold = meta.get("autoencoder", {}).get("anomaly_threshold", 0.05)
        except Exception as e:
            logger.warning(f"Anomaly detector load failed: {e}")

    @classmethod
    def score(cls, symptom_cluster_vector: list[float]) -> dict:
        """
        Compute anomaly score for a symptom embedding.
        Returns score 0-1 and whether it's anomalous.
        """
        if cls._iso_forest is not None:
            return cls._isolation_forest_score(symptom_cluster_vector)
        return cls._heuristic_score(symptom_cluster_vector)

    @classmethod
    def _isolation_forest_score(cls, vec: list[float]) -> dict:
        import numpy as np
        x = np.array(vec).reshape(1, -1)
        x_scaled = cls._scaler.transform(x)
        raw_score = cls._iso_forest.score_samples(x_scaled)[0]
        # Convert: more negative = more anomalous → map to 0-1
        normalised = max(0.0, min(1.0, (-raw_score - 0.2) / 0.6))
        return {
            "anomaly_score": round(float(normalised), 4),
            "is_anomalous": normalised > 0.7,
            "method": "isolation_forest",
        }

    @classmethod
    def _heuristic_score(cls, vec: list[float]) -> dict:
        """Statistical fallback: z-score based anomaly detection."""
        arr = np.array(vec)
        mean, std = 0.5, 0.15  # expected normal distribution stats
        z_scores = np.abs((arr - mean) / max(std, 1e-8))
        anomaly_score = min(1.0, float(z_scores.mean()) / 3.0)
        return {
            "anomaly_score": round(anomaly_score, 4),
            "is_anomalous": anomaly_score > 0.7,
            "method": "heuristic_zscore",
        }


# Module-level singleton
_detector = AnomalyDetector()
