import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.stock_movement import StockMovement
from app.models.product import Product


def _get_movement_df(product_id: str, db: Session) -> pd.DataFrame:
    movements = (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.created_at)
        .all()
    )

    if not movements:
        return pd.DataFrame()

    rows = [{"ds": m.created_at.date(), "delta": m.delta} for m in movements]
    df = pd.DataFrame(rows)
    df["ds"] = pd.to_datetime(df["ds"])
    df = df.groupby("ds")["delta"].sum().reset_index()
    df = df.rename(columns={"delta": "y"})
    return df


def _make_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create lag features for XGBoost."""
    df = df.copy()
    for lag in [1, 2, 3, 7]:
        df[f"lag_{lag}"] = df["y"].shift(lag)
    df["rolling_mean_7"] = df["y"].rolling(7).mean()
    df["rolling_std_7"] = df["y"].rolling(7).std()
    df["day_of_week"] = df["ds"].dt.dayofweek
    return df.dropna()


def run_forecast(product_id: str, db: Session) -> dict:
    from xgboost import XGBRegressor

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    df = _get_movement_df(str(product_id), db)

    insufficient = {
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

    if len(df) < 10:
        return insufficient

    featured = _make_features(df)
    if len(featured) < 5:
        return insufficient

    feature_cols = ["lag_1", "lag_2", "lag_3", "lag_7", "rolling_mean_7", "rolling_std_7", "day_of_week"]
    X = featured[feature_cols]
    y = featured["y"]

    model = XGBRegressor(n_estimators=50, max_depth=3, random_state=42, verbosity=0)
    model.fit(X, y)

    # forecast 14 days ahead using rolling prediction
    last_values = list(df["y"].values[-7:])
    forecast_series = []
    running_stock = float(product.quantity)
    stockout_date = None

    for i in range(14):
        future_date = datetime.utcnow() + timedelta(days=i + 1)
        lag_1 = last_values[-1] if len(last_values) >= 1 else 0
        lag_2 = last_values[-2] if len(last_values) >= 2 else 0
        lag_3 = last_values[-3] if len(last_values) >= 3 else 0
        lag_7 = last_values[-7] if len(last_values) >= 7 else 0
        rolling_mean = np.mean(last_values[-7:])
        rolling_std = np.std(last_values[-7:])
        dow = future_date.weekday()

        features = np.array([[lag_1, lag_2, lag_3, lag_7, rolling_mean, rolling_std, dow]])
        predicted_delta = float(model.predict(features)[0])

        running_stock += predicted_delta
        last_values.append(predicted_delta)

        forecast_series.append({
            "date": future_date.strftime("%Y-%m-%d"),
            "predicted_stock": max(0, round(running_stock)),
        })

        if running_stock <= 0 and stockout_date is None:
            stockout_date = future_date.strftime("%Y-%m-%d")

    days_remaining = None
    if stockout_date:
        delta = datetime.strptime(stockout_date, "%Y-%m-%d") - datetime.utcnow()
        days_remaining = max(0, delta.days)

    neg_movements = df[df["y"] < 0]["y"]
    avg_daily_consumption = abs(neg_movements.mean()) if len(neg_movements) > 0 else 0
    lead_time = product.supplier.lead_time_days if product.supplier else 7
    recommended_reorder_qty = round(avg_daily_consumption * (lead_time + 7)) if avg_daily_consumption > 0 else None

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
        "anomaly_flag": False,
        "generated_at": datetime.utcnow().isoformat(),
        "insufficient_data": False,
    }