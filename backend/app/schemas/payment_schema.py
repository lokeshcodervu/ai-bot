# schemas/payment_schema.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models.payment import PaymentStatus, PaymentGateway

class CreateOrderRequest(BaseModel):
    gateway: PaymentGateway = PaymentGateway.MOCK

class CreateOrderResponse(BaseModel):
    payment_id: UUID
    amount: int
    currency: str
    payment_status: PaymentStatus
    gateway_order_id: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    payment_id: UUID
    gateway_payment_id: Optional[str] = None
    gateway_signature: Optional[str] = None

class PaymentOut(BaseModel):
    id: UUID
    tenant_id: UUID
    subscription_id: Optional[UUID] = None
    amount: int
    currency: str
    payment_status: PaymentStatus
    payment_gateway: PaymentGateway
    gateway_payment_id: Optional[str] = None
    gateway_order_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
