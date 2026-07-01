# models/document.py

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    status = Column(String(50), default="PROCESSING", nullable=False) # PROCESSING, COMPLETED, FAILED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="documents")
    embedding_logs = relationship("EmbeddingLog", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document id={self.id} file_name={self.file_name} status={self.status}>"
