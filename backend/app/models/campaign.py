# models/campaign.py

import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Integer,
    Enum,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CampaignStatus(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    SUSPENDED = "Suspended"
    COMPLETED = "Completed"

class Campaign(Base):
    __tablename__ = "campaigns"

    __table_args__ = (
        Index("idx_campaign_tenant_status", "tenant_id", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT, nullable=False)
    
    # Scheduler Call Window settings
    start_time = Column(String(50), default="09:00", nullable=False)  # format: "HH:MM"
    end_time = Column(String(50), default="17:00", nullable=False)    # format: "HH:MM"
    timezone = Column(String(100), default="Asia/Kolkata", nullable=False)
    
    # Dialer Concurrency Settings
    max_concurrency = Column(Integer, default=2, nullable=False)
    
    # Dialer Smart Retry Settings
    retry_delay_minutes = Column(Integer, default=30, nullable=False)
    max_retries = Column(Integer, default=1, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="campaigns")

    def __repr__(self):
        return f"<Campaign {self.name} ({self.status})>"
