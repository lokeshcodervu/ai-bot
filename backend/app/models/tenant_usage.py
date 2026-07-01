# models/tenant_usage.py

import uuid
from sqlalchemy import Column, BigInteger, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class TenantUsage(Base):
    __tablename__ = "tenant_usages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # Analytics Fields
    total_calls = Column(BigInteger, default=0, nullable=False)
    total_minutes_used = Column(BigInteger, default=0, nullable=False)
    total_campaigns = Column(Integer, default=0, nullable=False)
    total_leads = Column(BigInteger, default=0, nullable=False)
    total_tokens_used = Column(BigInteger, default=0, nullable=False)
    total_tts_characters_used = Column(BigInteger, default=0, nullable=False)
    
    # Document limits/counts
    total_documents = Column(Integer, default=0, nullable=False)
    total_embeddings = Column(Integer, default=0, nullable=False)
    
    usage_reset_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship
    tenant = relationship("Tenant", back_populates="usage")

    def __repr__(self):
        return f"<TenantUsage tenant_id={self.tenant_id}>"
