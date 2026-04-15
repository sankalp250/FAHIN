"""Alert Agent — sends outbreak alerts to hospitals and logs them."""
import logging
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.alert_log import AlertLog
from app.models.outbreak_prediction import OutbreakPrediction

logger = logging.getLogger(__name__)


class AlertAgent:
    async def send_alerts(
        self,
        sector: str,
        city: str,
        disease: str,
        probability: float,
        peak_days: int | None,
        is_anomaly: bool = False,
    ) -> None:
        peak_str = f"in approximately {peak_days} days" if peak_days else "soon"
        alert_type = "anomaly_alert" if is_anomaly else "outbreak_alert"
        
        prefix = "🚨 ANOMALY DETECTED" if is_anomaly else "⚠️ OUTBREAK ALERT"
        
        message = (
            f"{prefix}: {disease} predicted in {sector}, {city}. "
            f"Probability: {probability:.0%}. Peak expected {peak_str}. "
        )
        if is_anomaly:
            message += "UNUSUAL SYMPTOM PATTERN — MANUAL REVIEW REQUIRED."
        else:
            message += "Please prepare additional capacity."

        logger.info(f"ALERT: {message}")

        async with AsyncSessionLocal() as db:
            # Save prediction record
            pred = OutbreakPrediction(
                city_sector=sector, city=city, disease=disease,
                prediction_date=date.today(),
                days_until_peak=peak_days,
                probability=probability,
                alert_sent=True,
                alert_sent_at=datetime.utcnow(),
            )
            db.add(pred)
            await db.flush()

            # Save alert log
            alert = AlertLog(
                prediction_id=pred.id,
                city_sector=sector, disease=disease,
                alert_type=alert_type, message=message,
            )
            db.add(alert)
            await db.commit()
