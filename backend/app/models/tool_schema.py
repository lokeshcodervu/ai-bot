# models/tool_schema.py

import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ToolSchema(Base):
    __tablename__ = "tool_schemas"

    __table_args__ = (
        Index("idx_tool_tenant_name", "tenant_id", "name", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    json_schema = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant", backref="tool_schemas")

    def __repr__(self):
        return f"<ToolSchema id={self.id} tenant_id={self.tenant_id} name={self.name} is_active={self.is_active}>"
