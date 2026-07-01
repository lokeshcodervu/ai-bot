# models/blacklist.py

import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class BlacklistedNumber(Base):
    __tablename__ = "blacklisted_numbers"

    __table_args__ = (
        Index("idx_blacklist_tenant_phone", "tenant_id", "phone", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    phone = Column(String(50), nullable=False)
    reason = Column(String(255), default="Opt-out", nullable=False)  # Opt-out, DND, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="blacklisted_numbers")

    def __repr__(self):
        return f"<BlacklistedNumber tenant_id={self.tenant_id} phone={self.phone}>"
