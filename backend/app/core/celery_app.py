"""Celery application — async task queue for agent processing."""
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "fahin",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.symptom_tasks",
        "app.tasks.prediction_tasks",
        "app.tasks.fl_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Beat schedule — runs on a timer
    beat_schedule={
        # Run city-wide outbreak prediction every 15 minutes
        "run-city-prediction": {
            "task": "app.tasks.prediction_tasks.run_city_prediction",
            "schedule": crontab(minute="*/15"),
            "args": ("Gurugram",),
        },
        # Fetch fresh env data every 30 minutes
        "fetch-env-data": {
            "task": "app.tasks.prediction_tasks.fetch_env_data",
            "schedule": crontab(minute="*/30"),
        },
        # Trigger FL round daily at 2am
        "fl-daily-round": {
            "task": "app.tasks.fl_tasks.trigger_fl_round",
            "schedule": crontab(hour=2, minute=0),
        },
    },
)
