from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.product import Product
from app.models.delivery import Delivery
from app.schemas.dashboard import DashboardSummary
from datetime import datetime, timedelta
from app.models.stock_movement import StockMovement
from app.schemas.dashboard import (
    AnalyticsData, CategoryStockItem,
    LowStockItem, DeliveryStatusCount, MovementPoint
)


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

def get_analytics(db: Session) -> AnalyticsData:
    # category stock
    category_rows = (
        db.query(
            Product.category,
            func.sum(Product.quantity).label("total_quantity"),
            func.count(Product.id).label("product_count"),
        )
        .filter(Product.category.isnot(None))
        .group_by(Product.category)
        .all()
    )
    category_stock = [
        CategoryStockItem(
            category=r.category,
            total_quantity=r.total_quantity,
            product_count=r.product_count,
        )
        for r in category_rows
    ]

    # low stock products
    low_stock_rows = (
        db.query(Product)
        .filter(Product.quantity <= Product.threshold)
        .order_by((Product.threshold - Product.quantity).desc())
        .limit(8)
        .all()
    )
    low_stock_products = [
        LowStockItem(
            name=p.name,
            quantity=p.quantity,
            threshold=p.threshold,
            gap=p.threshold - p.quantity,
        )
        for p in low_stock_rows
    ]

    # delivery status counts
    status_rows = (
        db.query(Delivery.status, func.count(Delivery.id).label("count"))
        .group_by(Delivery.status)
        .all()
    )
    delivery_status_counts = [
        DeliveryStatusCount(status=r.status, count=r.count)
        for r in status_rows
    ]

    # stock movement trend — last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    movement_rows = (
        db.query(
            func.date(StockMovement.created_at).label("date"),
            func.sum(case((StockMovement.delta > 0, StockMovement.delta), else_=0)).label("restocked"),
            func.sum(case((StockMovement.delta < 0, -StockMovement.delta), else_=0)).label("reduced"),
        )
        .filter(StockMovement.created_at >= thirty_days_ago)
        .group_by(func.date(StockMovement.created_at))
        .order_by(func.date(StockMovement.created_at))
        .all()
    )
    movement_trend = [
        MovementPoint(
            date=str(r.date),
            restocked=int(r.restocked or 0),
            reduced=int(r.reduced or 0),
        )
        for r in movement_rows
    ]

    return AnalyticsData(
        category_stock=category_stock,
        low_stock_products=low_stock_products,
        delivery_status_counts=delivery_status_counts,
        movement_trend=movement_trend,
    )