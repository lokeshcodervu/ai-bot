# schemas/company_verification_schema.py

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class DocumentMetadataOut(BaseModel):
    document_id: UUID
    tenant_id: UUID
    document_type: Optional[str] = None
    file_name: str
    file_url: str
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_by: Optional[UUID] = None
    uploaded_at: datetime
    verification_status: Optional[str] = "PENDING"

    model_config = ConfigDict(from_attributes=True)

class CompanyVerificationStatusOut(BaseModel):
    status: str
    country: Optional[str] = None
    company_name: str
    company_email: Optional[str] = None
    phone_number: Optional[str] = None
    owner_name: Optional[str] = None
    registered_office_address: Optional[str] = None
    company_number: Optional[str] = None
    submitted_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_doc_url: Optional[str] = None
    verified_token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class CompanyVerificationDetailOut(BaseModel):
    company_id: UUID
    company_name: str
    company_email: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    owner_name: Optional[str] = None
    registered_office_address: Optional[str] = None
    company_number: Optional[str] = None
    verification_status: str
    submitted_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[UUID] = None
    rejection_reason: Optional[str] = None
    documents: List[DocumentMetadataOut] = []

    model_config = ConfigDict(from_attributes=True)

class SuperAdminRejectRequest(BaseModel):
    reason: str

class SuperAdminApproveRequest(BaseModel):
    allowed_modules: Optional[List[str]] = ["campaigns", "leads", "live_monitor", "analytics", "rag", "settings"]
