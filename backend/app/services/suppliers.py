import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut, SupplierListOut


def _get_or_404(supplier_id: uuid.UUID, db: Session) -> Supplier:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


def list_suppliers(db: Session, search: Optional[str] = None) -> SupplierListOut:
    query = db.query(Supplier)
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    items = query.order_by(Supplier.name).all()
    return SupplierListOut(
        items=[SupplierOut.model_validate(s) for s in items],
        total=len(items),
    )


def create_supplier(payload: SupplierCreate, db: Session) -> SupplierOut:
    existing = db.query(Supplier).filter(Supplier.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Supplier name already exists")
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


def get_supplier(supplier_id: uuid.UUID, db: Session) -> SupplierOut:
    return SupplierOut.model_validate(_get_or_404(supplier_id, db))


def update_supplier(supplier_id: uuid.UUID, payload: SupplierUpdate, db: Session) -> SupplierOut:
    supplier = _get_or_404(supplier_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


def delete_supplier(supplier_id: uuid.UUID, db: Session) -> None:
    supplier = _get_or_404(supplier_id, db)
    if supplier.products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete supplier with linked products. Reassign products first.",
        )
    db.delete(supplier)
    db.commit()