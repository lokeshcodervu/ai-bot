# models/wallet.py

import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Balance details in smallest unit (e.g. cents/paise)
    balance = Column(Integer, default=0, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    # Gateway customer mapping
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    razorpay_customer_id = Column(String(255), unique=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship
    tenant = relationship("Tenant", back_populates="wallet")

    def __repr__(self):
        return f"<Wallet tenant_id={self.tenant_id} balance={self.balance} {self.currency}>"
