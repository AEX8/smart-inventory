import os
from celery import Celery
from app.config import settings

celery_app = Celery(
    "inventory_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Australia/Melbourne",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,  # results expire after 1 hour
)


@celery_app.task(name="run_forecast")
def run_forecast_task(product_id: str) -> dict:
    """Run demand forecast for a single product."""
    from app.database import SessionLocal
    from app.ml.forecast import run_forecast

    db = SessionLocal()
    try:
        result = run_forecast(product_id, db)
        return result
    finally:
        db.close()


@celery_app.task(name="run_anomaly_detection")
def run_anomaly_task() -> dict:
    """Run anomaly detection across all products."""
    from app.database import SessionLocal
    from app.ml.anomaly import run_anomaly_detection

    db = SessionLocal()
    try:
        results = run_anomaly_detection(db)
        return results
    finally:
        db.close()