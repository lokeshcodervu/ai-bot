# models/document.py

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger
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

    # VERIFICATION METADATA
    document_type = Column(String(100), nullable=True, index=True) # GST_REGISTRATION_CERTIFICATE, CERTIFICATE_OF_INCORPORATION, COMPANIES_HOUSE_CERTIFICATE, KNOWLEDGE_BASE
    mime_type = Column(String(100), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_status = Column(String(50), default="PENDING", nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="documents")
    uploaded_by_user = relationship("User", foreign_keys=[uploaded_by], lazy="selectin")
    embedding_logs = relationship("EmbeddingLog", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document id={self.id} file_name={self.file_name} status={self.status}>"
