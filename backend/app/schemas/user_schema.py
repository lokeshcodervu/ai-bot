# schemas/user_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models.user_model import UserRole

class UserBase(BaseModel):
    username: Optional[str] = None
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: Optional[UserRole] = UserRole.SALES_REP
    tenant_id: Optional[UUID] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class UserOut(UserBase):
    id: UUID
    username: str
    tenant_id: Optional[UUID] = None
    role: UserRole
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_active: bool
    is_2fa_enabled: bool
    notes: Optional[str] = None
    password_changed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RegisterUserMinimal(BaseModel):
    username: str
    email: EmailStr
    phone_number: Optional[str] = None
    role: UserRole

class RegisterResponse(BaseModel):
    status: str
    message: str
    signup_token: str
    user: RegisterUserMinimal
