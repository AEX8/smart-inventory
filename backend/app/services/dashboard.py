from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.product import Product
from app.models.delivery import Delivery
from app.schemas.dashboard import DashboardSummary


def get_summary(db: Session) -> DashboardSummary:
    total_products = db.query(func.count(Product.id)).scalar()

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.quantity > 0, Product.quantity <= Product.threshold)
        .scalar()
    )

    critical_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.quantity == 0)
        .scalar()
    )

    pending_deliveries = (
        db.query(func.count(Delivery.id))
        .filter(Delivery.status.in_(["processing", "in_transit"]))
        .scalar()
    )

    delayed_deliveries = (
        db.query(func.count(Delivery.id))
        .filter(Delivery.status == "delayed")
        .scalar()
    )

    return DashboardSummary(
        total_products=total_products,
        low_stock_count=low_stock_count,
        critical_stock_count=critical_stock_count,
        pending_deliveries=pending_deliveries,
        delayed_deliveries=delayed_deliveries,
        anomalies_flagged=0,  # wired up in v2 when ML layer is built
    )