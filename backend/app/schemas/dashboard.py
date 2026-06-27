from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_products: int
    low_stock_count: int       # quantity > 0 and quantity <= threshold
    critical_stock_count: int  # quantity == 0
    pending_deliveries: int    # status in (processing, in_transit)
    delayed_deliveries: int    # status == delayed
    anomalies_flagged: int     # placeholder until ML layer is built (v2)