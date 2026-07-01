# models/prompt_version.py

import uuid
from sqlalchemy import (
    Column,
    Integer,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    __table_args__ = (
        Index("idx_prompt_tenant_version", "tenant_id", "version", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    version = Column(Integer, nullable=False)
    prompt_text = Column(Text, nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant", backref="prompt_versions")

    def __repr__(self):
        return f"<PromptVersion id={self.id} tenant_id={self.tenant_id} version={self.version} is_active={self.is_active}>"
