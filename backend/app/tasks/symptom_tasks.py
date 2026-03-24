"""Celery tasks for async symptom processing."""
from app.core.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_symptom_report_task(self, report_id: str, sector: str, city: str):
    """Process a single symptom report through the full agent pipeline."""
    import asyncio
    try:
        from app.services.agents.orchestrator import process_symptom_report
        asyncio.get_event_loop().run_until_complete(
            process_symptom_report(report_id, sector, city)
        )
        logger.info(f"Processed report {report_id}")
    except Exception as exc:
        logger.error(f"Task failed for report {report_id}: {exc}")
        raise self.retry(exc=exc)
