import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

VALID_REASONS = {"restock", "sold", "damaged", "returned", "audit_correction"}


class SupplierOut(BaseModel):
    id: uuid.UUID
    name: str
    lead_time_days: int

    model_config = {"from_attributes": True}


# product
class ProductCreate(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    initial_stock: int = 0
    threshold: int = 10
    supplier_id: Optional[uuid.UUID] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    threshold: Optional[int] = None
    supplier_id: Optional[uuid.UUID] = None


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    category: Optional[str]
    quantity: int
    threshold: int
    supplier_id: Optional[uuid.UUID]
    supplier: Optional[SupplierOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


# stock movement 
class StockAdjustInput(BaseModel):
    delta: int
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        if v not in VALID_REASONS:
            raise ValueError(f"reason must be one of {VALID_REASONS}")
        return v

    @field_validator("delta")
    @classmethod
    def validate_delta(cls, v: int) -> int:
        if v == 0:
            raise ValueError("delta cannot be zero")
        return v


class StockMovementOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    delta: int
    reason: str
    created_by: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}