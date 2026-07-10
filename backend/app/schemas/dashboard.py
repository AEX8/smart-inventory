from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_products: int
    low_stock_count: int       # quantity > 0 and quantity <= threshold
    critical_stock_count: int  # quantity == 0
    pending_deliveries: int    # status in (processing, in_transit)
    delayed_deliveries: int    # status == delayed
    anomalies_flagged: int     # placeholder until ML layer is built (v2)


class CategoryStockItem(BaseModel):
    category: str
    total_quantity: int
    product_count: int


class LowStockItem(BaseModel):
    name: str
    quantity: int
    threshold: int
    gap: int  # threshold - quantity


class MovementPoint(BaseModel):
    date: str
    restocked: int
    reduced: int


class DeliveryStatusCount(BaseModel):
    status: str
    count: int


class AnalyticsData(BaseModel):
    category_stock: list[CategoryStockItem]
    low_stock_products: list[LowStockItem]
    delivery_status_counts: list[DeliveryStatusCount]
    movement_trend: list[MovementPoint]