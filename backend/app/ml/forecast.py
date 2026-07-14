import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.stock_movement import StockMovement
from app.models.product import Product


MODEL_DIR = "/tmp/ml_models"
os.makedirs(MODEL_DIR, exist_ok=True)


def _get_movement_df(product_id: str, db: Session) -> pd.DataFrame:
    """Pull stock movements for a product and return as a daily aggregated DataFrame."""
    movements = (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.created_at)
        .all()
    )

    if not movements:
        return pd.DataFrame()

    rows = [
        {
            "ds": m.created_at.date(),
            "delta": m.delta,
        }
        for m in movements
    ]

    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.groupby("ds")["delta"].sum().reset_index()
    df = df.rename(columns={"delta": "y"})
    return df


def run_forecast(product_id: str, db: Session) -> dict:
    """
    Run demand forecast for a product.
    Returns predicted stockout date, days remaining,
    recommended reorder qty, and 14-day forecast series.
    """
    from prophet import Prophet

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    df = _get_movement_df(str(product_id), db)

    # need at least 2 data points for Prophet
    if len(df) < 2:
        return {
            "product_id": str(product_id),
            "product_name": product.name,
            "current_stock": product.quantity,
            "predicted_stockout_date": None,
            "days_remaining": None,
            "recommended_reorder_qty": None,
            "confidence": 0.0,
            "forecast_series": [],
            "anomaly_flag": False,
            "generated_at": datetime.utcnow().isoformat(),
            "insufficient_data": True,
        }

    # fit Prophet on daily stock deltas
    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False,
        changepoint_prior_scale=0.05,
        interval_width=0.8,
    )
    model.fit(df)

    # forecast 30 days ahead
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)

    # simulate running stock from current quantity
    future_forecast = forecast[forecast["ds"] > pd.Timestamp.now()][["ds", "yhat"]].head(30)
    running_stock = product.quantity
    stockout_date = None
    forecast_series = []

    for _, row in future_forecast.iterrows():
        running_stock += row["yhat"]
        forecast_series.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted_stock": max(0, round(running_stock)),
        })
        if running_stock <= 0 and stockout_date is None:
            stockout_date = row["ds"].strftime("%Y-%m-%d")

    days_remaining = None
    if stockout_date:
        delta = datetime.strptime(stockout_date, "%Y-%m-%d") - datetime.utcnow()
        days_remaining = max(0, delta.days)

    # recommended reorder = avg daily consumption * (lead time + 7 day buffer)
    avg_daily_consumption = abs(df[df["y"] < 0]["y"].mean()) if len(df[df["y"] < 0]) > 0 else 0
    lead_time = product.supplier.lead_time_days if product.supplier else 7
    recommended_reorder_qty = round(avg_daily_consumption * (lead_time + 7)) if avg_daily_consumption > 0 else None

    # confidence based on data points available
    confidence = min(1.0, len(df) / 30)

    return {
        "product_id": str(product_id),
        "product_name": product.name,
        "current_stock": product.quantity,
        "predicted_stockout_date": stockout_date,
        "days_remaining": days_remaining,
        "recommended_reorder_qty": recommended_reorder_qty,
        "confidence": round(confidence, 2),
        "forecast_series": forecast_series,
        "anomaly_flag": False,  # updated by anomaly detection
        "generated_at": datetime.utcnow().isoformat(),
        "insufficient_data": False,
    }