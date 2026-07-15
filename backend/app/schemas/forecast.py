import uuid
from typing import Optional
from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: str
    predicted_stock: int


class ForecastOut(BaseModel):
    product_id: str
    product_name: str
    current_stock: int
    predicted_stockout_date: Optional[str]
    days_remaining: Optional[int]
    recommended_reorder_qty: Optional[int]
    confidence: float
    forecast_series: list[ForecastPoint]
    anomaly_flag: bool
    generated_at: str
    insufficient_data: bool = False


class ForecastListOut(BaseModel):
    items: list[ForecastOut]
    total: int