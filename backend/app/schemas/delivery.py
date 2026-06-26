import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator

VALID_STATUSES = {"processing", "in_transit", "delivered", "delayed", "cancelled"}

# valid transitions — what each status can move to
STATUS_TRANSITIONS: dict[str, set[str]] = {
    "processing":  {"in_transit", "cancelled"},
    "in_transit":  {"delivered", "delayed", "cancelled"},
    "delayed":     {"in_transit", "cancelled"},
    "delivered":   set(),   # terminal
    "cancelled":   set(),   # terminal
}


class DeliveryCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int
    eta: Optional[datetime] = None
    notes: Optional[str] = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity must be greater than zero")
        return v


class DeliveryStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {VALID_STATUSES}")
        return v


class DeliveryOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None   # joined from product
    quantity: int
    status: str
    eta: Optional[datetime]
    notes: Optional[str]
    created_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeliveryListOut(BaseModel):
    items: list[DeliveryOut]
    total: int
    page: int
    page_size: int