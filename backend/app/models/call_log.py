# models/call_log.py

import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CallLog(Base):
    __tablename__ = "call_logs"

    __table_args__ = (
        Index("idx_call_log_tenant_campaign", "tenant_id", "campaign_id"),
        Index("idx_call_log_lead", "lead_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    
    call_duration = Column(Integer, default=0, nullable=False)  # in seconds
    call_disposition = Column(String(255), nullable=False)      # Answered, Busy, No Answer, etc.
    recording_url = Column(String(500), nullable=True)          # Mock S3 URL
    ai_summary = Column(Text, nullable=True)                    # AI compressed summary
    intent_tag = Column(String(100), nullable=True)             # Warm, Cold, Visit Scheduled, etc.
    transcript = Column(JSON, nullable=True)                    # List of dialogue turns

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant")
    lead = relationship("Lead")
    campaign = relationship("Campaign")

    def __repr__(self):
        return f"<CallLog {self.id} (Lead: {self.lead_id}, Status: {self.call_disposition})>"
