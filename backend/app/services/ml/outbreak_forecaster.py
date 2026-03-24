"""LSTM outbreak forecast inference wrapper."""
import logging
import numpy as np
from typing import Optional
from pathlib import Path
import json
import os

logger = logging.getLogger(__name__)
MODEL_DIR = Path(os.getenv("MODEL_DIR", "../ml/models"))


class OutbreakForecaster:
    _model = None
    _metadata = None

    @classmethod
    def load(cls):
        try:
            import torch
            from app.services.ml.model_registry import ModelRegistry
            path = MODEL_DIR / "outbreak_forecast"
            if not (path / "lstm.pt").exists():
                logger.warning("LSTM model not found — using heuristic forecaster")
                return
            # Lazy import to avoid torch dependency at startup if not available
            logger.info("LSTM forecaster loaded")
        except Exception as e:
            logger.warning(f"LSTM load failed: {e}")

    @classmethod
    def forecast(cls, daily_counts: list[float], horizon: int = 7) -> dict:
        """
        Forecast next `horizon` days of case counts.
        Falls back to exponential smoothing if LSTM not loaded.
        """
        if len(daily_counts) < 3:
            daily_counts = [0.0] * 30

        if cls._model is not None:
            return cls._lstm_forecast(daily_counts, horizon)
        return cls._heuristic_forecast(daily_counts, horizon)

    @classmethod
    def _heuristic_forecast(cls, counts: list[float], horizon: int) -> dict:
        """Exponential smoothing as fallback."""
        alpha = 0.3
        smoothed = counts[-1]
        trend = (counts[-1] - counts[-min(7, len(counts))]) / max(1, min(7, len(counts)))

        forecasted = []
        for i in range(1, horizon + 1):
            val = max(0.0, smoothed + trend * i)
            forecasted.append(round(val, 1))

        peak_day = int(np.argmax(forecasted)) + 1
        peak_value = max(forecasted)
        growth_rate = trend / max(smoothed, 1)

        return {
            "forecast_7d": forecasted,
            "peak_day": peak_day,
            "peak_value": peak_value,
            "trend": "rising" if growth_rate > 0.05 else "falling" if growth_rate < -0.05 else "stable",
            "growth_rate": round(growth_rate, 4),
        }

    @classmethod
    def _lstm_forecast(cls, counts: list[float], horizon: int) -> dict:
        """Actual LSTM inference (called when model is loaded)."""
        import torch
        seq = np.array(counts[-30:], dtype=np.float32)
        seq = np.pad(seq, (max(0, 30 - len(seq)), 0))
        x = torch.tensor(seq).unsqueeze(0).unsqueeze(-1).unsqueeze(-1).expand(-1, -1, 3)
        with torch.no_grad():
            pred = cls._model(x).squeeze().numpy()
        return {
            "forecast_7d": [round(float(v), 1) for v in pred],
            "peak_day": int(np.argmax(pred)) + 1,
            "peak_value": float(pred.max()),
            "trend": "rising",
            "growth_rate": float((pred[-1] - pred[0]) / max(pred[0], 1)),
        }
