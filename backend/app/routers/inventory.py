import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_admin, require_staff_or_admin
from app.models.user import User
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut,
    ProductListOut, StockAdjustInput, StockMovementOut,
)
from app.services import inventory as svc

router = APIRouter()


# products 

@router.get("/products", response_model=ProductListOut)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None),
    stock_status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.list_products(db, page, page_size, search, stock_status, category)


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    return svc.create_product(payload, db, current_user)


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_product(product_id, db)


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    return svc.update_product(product_id, payload, db)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc.delete_product(product_id, db)


# stock movements
@router.post("/products/{product_id}/adjust", response_model=ProductOut)
def adjust_stock(
    product_id: uuid.UUID,
    payload: StockAdjustInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff_or_admin),
):
    return svc.adjust_stock(product_id, payload, db, current_user)


@router.get("/products/{product_id}/movements", response_model=list[StockMovementOut])
def get_movements(
    product_id: uuid.UUID,
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_movements(product_id, db, limit)