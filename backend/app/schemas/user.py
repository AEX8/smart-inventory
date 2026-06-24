import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
 
 
VALID_ROLES = {"admin", "warehouse_staff", "driver"}
 
 
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "warehouse_staff"

    def model_post_init(self, __context):
        if self.role not in VALID_ROLES:
            raise ValueError(f"role must be one of {VALID_ROLES}")
        if len(self.password.encode("utf-8")) > 72:
            raise ValueError("password must be 72 characters or fewer")
 
 
class UserLogin(BaseModel):
    email: EmailStr
    password: str
 
 
class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    created_at: datetime
 
    model_config = {"from_attributes": True}
 
 
class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut