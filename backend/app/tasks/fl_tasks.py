"""Federated learning lifecycle tasks."""
from app.core.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task
def trigger_fl_round():
    """Notify all hospital FL clients that a new training round is starting."""
    logger.info("Triggering daily FL round")
