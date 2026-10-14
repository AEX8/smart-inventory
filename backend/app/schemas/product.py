import uuid
from datetime import datetime
from typing import Annotated, Optional
from pydantic import AfterValidator, BaseModel, Field, field_validator

VALID_REASONS = {"restock", "sold", "damaged", "returned", "audit_correction"}


def _validate_image_url(v: Optional[str]) -> Optional[str]:
    # only allow site-relative paths or http(s) URLs, blocks javascript: and data: URLs
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    if v.startswith("/") and not v.startswith("//"):
        return v
    if v.startswith(("https://", "http://")):
        return v
    raise ValueError("image_url must be a path starting with / or an http(s) URL")


ImageUrl = Annotated[Optional[str], Field(max_length=500), AfterValidator(_validate_image_url)]


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
    image_url: ImageUrl = None
    initial_stock: int = 0
    threshold: int = 10
    supplier_id: Optional[uuid.UUID] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    image_url: ImageUrl = None
    threshold: Optional[int] = None
    supplier_id: Optional[uuid.UUID] = None


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    sku: str
    category: Optional[str]
    image_url: Optional[str]
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