import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.stock_movement import StockMovement
from app.models.product import Product


def run_anomaly_detection(db: Session) -> dict[str, bool]:
    """
    Run Isolation Forest across all products.
    Returns a dict of product_id -> is_anomaly.
    """
    from sklearn.ensemble import IsolationForest

    # get all products
    products = db.query(Product).all()
    if not products:
        return {}

    results = {}

    for product in products:
        movements = (
            db.query(StockMovement)
            .filter(StockMovement.product_id == product.id)
            .order_by(StockMovement.created_at)
            .all()
        )

        if len(movements) < 5:
            results[str(product.id)] = False
            continue

        deltas = np.array([m.delta for m in movements]).reshape(-1, 1)

        model = IsolationForest(
            contamination=0.1,
            random_state=42,
        )
        preds = model.fit_predict(deltas)

        # -1 means anomaly in Isolation Forest
        anomaly_count = np.sum(preds == -1)
        anomaly_ratio = anomaly_count / len(preds)

        # flag if more than 20% of movements are anomalous
        results[str(product.id)] = anomaly_ratio > 0.2

    return results