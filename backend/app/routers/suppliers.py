import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, require_admin, require_staff_or_admin
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut, SupplierListOut
from app.services import suppliers as svc

router = APIRouter()


@router.get("", response_model=SupplierListOut)
def list_suppliers(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.list_suppliers(db, search)


@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    return svc.create_supplier(payload, db)


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return svc.get_supplier(supplier_id, db)


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: uuid.UUID,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    return svc.update_supplier(supplier_id, payload, db)


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    svc.delete_supplier(supplier_id, db)