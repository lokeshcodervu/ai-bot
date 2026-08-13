# schemas/auth_schema.py

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from uuid import UUID
from app.models.user_model import UserRole

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    full_name: Optional[str] = None
    role: Optional[UserRole] = None

class SendSignupOTPRequest(BaseModel):
    signup_token: str

class SendEmailOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    signup_token: str
    otp: str

class VerifyOTPResponse(BaseModel):
    status: str
    message: str
    verified_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None
    tenant: Optional[dict] = None

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    tenant_id: Optional[UUID] = None

class SelectIndustryRequest(BaseModel):
    verified_token: str
    industry: str

class CompleteOnboardingRequest(BaseModel):
    verified_token: str
    plan: Optional[str] = "pro"
    payment_method: Optional[str] = "card"
    card_number: Optional[str] = None
    card_cvc: Optional[str] = None
    upi_id: Optional[str] = None


