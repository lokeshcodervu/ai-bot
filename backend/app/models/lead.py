# models/lead.py

import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Text,
    Enum,
    DateTime,
    ForeignKey,
    Index,
    Integer
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class LeadStatus(str, enum.Enum):
    IMPORTED = "Imported"
    PENDING_QUEUE = "Pending Queue"
    READY_TO_CALL = "Ready To Call"
    CONNECTED = "Connected"
    CONVERTED = "Converted"
    NEEDS_FOLLOW_UP = "Needs Follow-up"
    NOT_INTERESTED = "Not Interested"

class Lead(Base):
    __tablename__ = "leads"

    __table_args__ = (
        Index("idx_lead_tenant_status", "tenant_id", "status"),
        Index("idx_lead_phone", "phone"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(LeadStatus), default=LeadStatus.IMPORTED, nullable=False)
    campaign_id = Column(UUID(as_uuid=True), nullable=True)  # Will be linked in Campaign phase
    call_disposition = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    last_call_at = Column(DateTime(timezone=True), nullable=True)
    next_call_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="leads")

    def __repr__(self):
        return f"<Lead {self.name} ({self.status})>"
