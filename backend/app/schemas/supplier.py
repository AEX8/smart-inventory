import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class SupplierCreate(BaseModel):
    name: str
    contact_email: Optional[EmailStr] = None
    lead_time_days: int = 7


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    lead_time_days: Optional[int] = None


class SupplierOut(BaseModel):
    id: uuid.UUID
    name: str
    contact_email: Optional[str]
    lead_time_days: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SupplierListOut(BaseModel):
    items: list[SupplierOut]
    total: int