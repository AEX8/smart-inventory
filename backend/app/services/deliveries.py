import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.delivery import Delivery
from app.models.product import Product
from app.models.user import User
from app.schemas.delivery import (
    DeliveryCreate, DeliveryStatusUpdate,
    DeliveryOut, DeliveryListOut, STATUS_TRANSITIONS,
)
from app.models.stock_movement import StockMovement


# helpers
def _get_or_404(delivery_id: uuid.UUID, db: Session) -> Delivery:
    delivery = (
        db.query(Delivery)
        .options(joinedload(Delivery.product))
        .filter(Delivery.id == delivery_id)
        .first()
    )
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


def _to_out(delivery: Delivery) -> DeliveryOut:
    out = DeliveryOut.model_validate(delivery)
    if delivery.product:
        out.product_name = delivery.product.name
    return out


# deliveries 
def list_deliveries(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    status_filter: Optional[str] = None,
    product_id: Optional[uuid.UUID] = None,
) -> DeliveryListOut:
    query = db.query(Delivery).options(joinedload(Delivery.product))

    if status_filter:
        query = query.filter(Delivery.status == status_filter)

    if product_id:
        query = query.filter(Delivery.product_id == product_id)

    total = query.count()
    items = (
        query.order_by(Delivery.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return DeliveryListOut(
        items=[_to_out(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def create_delivery(
    payload: DeliveryCreate, db: Session, current_user: User
) -> DeliveryOut:
    # ensure product exists
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    delivery = Delivery(
        product_id=payload.product_id,
        quantity=payload.quantity,
        eta=payload.eta,
        notes=payload.notes,
        status="processing",
        created_by=current_user.id,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return _to_out(delivery)


def get_delivery(delivery_id: uuid.UUID, db: Session) -> DeliveryOut:
    return _to_out(_get_or_404(delivery_id, db))


def update_status(
    delivery_id: uuid.UUID, payload: DeliveryStatusUpdate, db: Session
) -> DeliveryOut:
    delivery = _get_or_404(delivery_id, db)

    allowed = STATUS_TRANSITIONS.get(delivery.status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{delivery.status}' to '{payload.status}'. "
                   f"Allowed transitions: {allowed or 'none (terminal status)'}",
        )

    delivery.status = payload.status
    if payload.notes:
        delivery.notes = payload.notes

    # when delivered, automatically update stock
    if payload.status == "delivered":
        product = db.query(Product).filter(Product.id == delivery.product_id).first()
        if product:
            product.quantity += delivery.quantity
            db.add(StockMovement(
                product_id=product.id,
                delta=delivery.quantity,
                reason="restock",
                created_by=None,
            ))

    db.commit()
    db.refresh(delivery)
    return _to_out(delivery)

def delete_delivery(delivery_id: uuid.UUID, db: Session) -> None:
    delivery = _get_or_404(delivery_id, db)

    if delivery.status not in ("processing", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only processing or cancelled deliveries can be deleted",
        )

    db.delete(delivery)
    db.commit()