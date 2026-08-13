# models/audit_log.py

import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    __table_args__ = (
        Index("idx_audit_tenant_created", "tenant_id", "created_at"),
        Index("idx_audit_action", "action"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    performed_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    action = Column(String(100), nullable=False) # SUBMITTED, APPROVED, REJECTED, RESUBMITTED, SUSPENDED, REACTIVATED
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    meta_data = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    tenant = relationship("Tenant")
    performed_by_user = relationship("User", foreign_keys=[performed_by], lazy="selectin")

    def __repr__(self):
        return f"<AuditLog action={self.action} tenant_id={self.tenant_id} new_status={self.new_status}>"
