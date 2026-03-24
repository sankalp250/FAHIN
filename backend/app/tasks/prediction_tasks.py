"""Scheduled prediction tasks."""
from app.core.celery_app import celery_app
import logging

logger = logging.getLogger(__name__)


@celery_app.task
def run_city_prediction(city: str = "Gurugram"):
    """Run outbreak predictions for all sectors in the city."""
    logger.info(f"Running city-wide prediction for {city}")
    # In production: query recent symptom clusters per sector and run agent pipeline


@celery_app.task
def fetch_env_data():
    """Fetch fresh AQI + weather data for all monitored sectors."""
    logger.info("Fetching environmental data for all sectors")
