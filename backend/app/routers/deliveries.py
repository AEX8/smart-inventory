import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_admin, require_staff_or_admin
from app.models.user import User
from app.schemas.delivery import (
    DeliveryCreate, DeliveryStatusUpdate, DeliveryOut, DeliveryListOut,
)
from app.services import deliveries as svc

router = APIRouter()


@router.get("", response_model=DeliveryListOut)
def list_deliveries(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = Query(None),
    product_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.list_deliveries(db, page, page_size, status, product_id)


@router.post("", response_model=DeliveryOut, status_code=201)
def create_delivery(
    payload: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    return svc.create_delivery(payload, db, current_user)


@router.get("/{delivery_id}", response_model=DeliveryOut)
def get_delivery(
    delivery_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_delivery(delivery_id, db)


@router.patch("/{delivery_id}/status", response_model=DeliveryOut)
def update_status(
    delivery_id: uuid.UUID,
    payload: DeliveryStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    return svc.update_status(delivery_id, payload, db)


@router.delete("/{delivery_id}", status_code=204)
def delete_delivery(
    delivery_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc.delete_delivery(delivery_id, db)