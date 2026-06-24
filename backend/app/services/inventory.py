import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.user import User
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut,
    ProductListOut, StockAdjustInput, StockMovementOut,
)


# helpers

def _get_or_404(product_id: uuid.UUID, db: Session) -> Product:
    product = (
        db.query(Product)
        .options(joinedload(Product.supplier))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


# products
def list_products(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    stock_status: Optional[str] = None,
    category: Optional[str] = None,
) -> ProductListOut:
    query = db.query(Product).options(joinedload(Product.supplier))

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            func.lower(Product.name).like(term) | func.lower(Product.sku).like(term)
        )

    if category:
        query = query.filter(func.lower(Product.category) == category.lower())

    if stock_status:
        if stock_status == "critical":
            query = query.filter(Product.quantity == 0)
        elif stock_status == "low":
            query = query.filter(Product.quantity > 0, Product.quantity <= Product.threshold)
        elif stock_status == "healthy":
            query = query.filter(Product.quantity > Product.threshold)

    total = query.count()
    items = query.order_by(Product.name).offset((page - 1) * page_size).limit(page_size).all()

    return ProductListOut(
        items=[ProductOut.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def create_product(payload: ProductCreate, db: Session, current_user: User) -> ProductOut:
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SKU already exists")

    product = Product(
        name=payload.name,
        sku=payload.sku,
        category=payload.category,
        quantity=payload.initial_stock,
        threshold=payload.threshold,
        supplier_id=payload.supplier_id,
    )
    db.add(product)
    db.flush()  # get product.id before committing

    # record initial stock as a movement
    if payload.initial_stock > 0:
        movement = StockMovement(
            product_id=product.id,
            delta=payload.initial_stock,
            reason="restock",
            created_by=current_user.id,
        )
        db.add(movement)

    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


def get_product(product_id: uuid.UUID, db: Session) -> ProductOut:
    return ProductOut.model_validate(_get_or_404(product_id, db))


def update_product(
    product_id: uuid.UUID, payload: ProductUpdate, db: Session
) -> ProductOut:
    product = _get_or_404(product_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


def delete_product(product_id: uuid.UUID, db: Session) -> None:
    product = _get_or_404(product_id, db)
    db.delete(product)
    db.commit()


# stock movements

def adjust_stock(
    product_id: uuid.UUID,
    payload: StockAdjustInput,
    db: Session,
    current_user: User,
) -> ProductOut:
    product = _get_or_404(product_id, db)

    new_quantity = product.quantity + payload.delta
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Adjustment would result in negative stock ({new_quantity})",
        )

    product.quantity = new_quantity
    movement = StockMovement(
        product_id=product.id,
        delta=payload.delta,
        reason=payload.reason,
        created_by=current_user.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(product)
    return ProductOut.model_validate(product)


def get_movements(
    product_id: uuid.UUID, db: Session, limit: int = 30
) -> list[StockMovementOut]:
    _get_or_404(product_id, db)  # ensure product exists
    movements = (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
        .all()
    )
    return [StockMovementOut.model_validate(m) for m in movements]