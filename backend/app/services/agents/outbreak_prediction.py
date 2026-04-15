"""Outbreak Prediction Agent — runs ML models and produces probability score."""
import logging
from typing import Any

from app.services.ml.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class OutbreakPredictionAgent:
    async def predict(
        self,
        sector: str,
        city: str,
        disease_hypotheses: list[str],
        symptom_embedding: list[float] | None,
        env_risk_score: float,
    ) -> dict[str, Any]:
        """Run all ML models and compute combined outbreak probability."""

        # 1. Classifier Score (Current model context)
        classifier_score = await self._run_classifier(disease_hypotheses, env_risk_score)
        
        # 2. LSTM Forecast Score
        forecast_score = await self._run_forecaster(sector, city)
        
        # 3. Anomaly Detector Score
        anomaly_score = await self._run_anomaly_detector(symptom_embedding)

        # Weighted combination
        probability = (
            classifier_score * 0.40 +
            forecast_score  * 0.35 +
            anomaly_score   * 0.25
        )
        probability = min(1.0, max(0.0, probability))

        primary_disease = disease_hypotheses[0] if disease_hypotheses else "Unknown"
        peak_days = self._estimate_peak_days(probability)

        return {
            "outbreak_probability": probability,
            "predicted_disease": primary_disease,
            "predicted_peak_days": peak_days,
            "anomaly_detected": anomaly_score > 0.7,
            "classifier_score": classifier_score,
            "forecast_score": forecast_score,
            "anomaly_score": anomaly_score,
        }

    async def _run_classifier(self, diseases: list[str], env_risk: float) -> float:
        """Disease classifier score."""
        # Note: In production, this would use the top probability from the classifier model
        # For the agent, we reinforce it with environmental risk
        base = 0.3
        if "Dengue" in diseases and env_risk > 0.6:
            base += 0.4
        elif "Influenza" in diseases:
            base += 0.25
        elif "Unknown" in diseases:
            base += 0.15
        return min(1.0, base + env_risk * 0.2)

    async def _run_forecaster(self, sector: str, city: str) -> float:
        """LSTM forecast score — uses last 30 days of data."""
        # In a real system, we'd fetch actual historical counts from the DB here.
        # For now, we use a fallback if data is missing.
        try:
            # Dummy history for demo (3 inputs: reports, sales, admissions)
            # In production: history = await db.get_history(...)
            dummy_history = [[5.0, 10.0, 2.0]] * 30 
            
            forecast = ModelRegistry.forecast_outbreak(dummy_history)
            if forecast:
                # Calculate "outbreak-ness" based on forecast trend
                avg_future = sum(forecast) / len(forecast)
                last_val = dummy_history[-1][0]
                # If predicted avg is 2x current baseline, it's a 1.0 risk
                risk = min(1.0, (avg_future / (last_val + 1e-8)) / 2.0)
                return risk
        except Exception as e:
            logger.warning(f"Forecaster failed: {e}")
            
        return 0.45

    async def _run_anomaly_detector(self, embedding: list[float] | None) -> float:
        """Autoencoder anomaly score."""
        if embedding:
            try:
                result = ModelRegistry.detect_anomaly(embedding)
                return result.get("anomaly_score", 0.35)
            except Exception as e:
                logger.warning(f"Anomaly detection failed: {e}")
        return 0.35

    def _estimate_peak_days(self, probability: float) -> int:
        if probability >= 0.8:
            return 3
        if probability >= 0.6:
            return 7
        if probability >= 0.4:
            return 14
        return 21
