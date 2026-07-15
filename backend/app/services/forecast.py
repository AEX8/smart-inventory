import uuid
import json
import numpy as np
import redis
from sqlalchemy.orm import Session
from app.config import settings
from app.models.product import Product
from app.schemas.forecast import ForecastOut, ForecastListOut
from app.ml.forecast import run_forecast
from app.ml.anomaly import run_anomaly_detection

CACHE_TTL = 300


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        return super().default(obj)


def _get_redis():
    return redis.from_url(settings.REDIS_URL)


def get_product_forecast(product_id: uuid.UUID, db: Session) -> ForecastOut:
    r = _get_redis()
    cache_key = f"forecast:{product_id}"

    cached = r.get(cache_key)
    if cached:
        return ForecastOut(**json.loads(cached))

    anomaly_results = run_anomaly_detection(db)
    result = run_forecast(str(product_id), db)
    result["anomaly_flag"] = anomaly_results.get(str(product_id), False)

    r.setex(cache_key, CACHE_TTL, json.dumps(result, cls=NumpyEncoder))

    return ForecastOut(**result)


def get_all_forecasts(db: Session) -> ForecastListOut:
    r = _get_redis()
    products = db.query(Product).all()
    anomaly_results = run_anomaly_detection(db)

    items = []
    for product in products:
        cache_key = f"forecast:{product.id}"
        cached = r.get(cache_key)

        if cached:
            data = json.loads(cached)
        else:
            data = run_forecast(str(product.id), db)
            data["anomaly_flag"] = anomaly_results.get(str(product.id), False)
            r.setex(cache_key, CACHE_TTL, json.dumps(data, cls=NumpyEncoder))

        items.append(ForecastOut(**data))

    return ForecastListOut(items=items, total=len(items))


def invalidate_product_cache(product_id: uuid.UUID):
    r = _get_redis()
    r.delete(f"forecast:{product_id}")