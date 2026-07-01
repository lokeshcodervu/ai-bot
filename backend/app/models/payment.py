# models/payment.py

import uuid
import enum
from sqlalchemy import Column, String, Numeric, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"

class PaymentGateway(str, enum.Enum):
    STRIPE = "STRIPE"
    RAZORPAY = "RAZORPAY"
    MOCK = "MOCK"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_gateway = Column(Enum(PaymentGateway), default=PaymentGateway.MOCK, nullable=False)
    
    gateway_payment_id = Column(String(255), nullable=True)
    gateway_order_id = Column(String(255), nullable=True)
    gateway_signature = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="payments")
    subscription = relationship("Subscription", back_populates="payments")

    def __repr__(self):
        return f"<Payment {self.id} - {self.amount} {self.currency}>"
