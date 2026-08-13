# services/company_verification_service.py

import os
import shutil
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.tenant import Tenant, TenantVerificationStatus
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.models.user_model import User
from app.config.settings import settings

# Supported Countries
SUPPORTED_COUNTRIES = {"INDIA", "UNITED_KINGDOM"}

# Document Types
DOC_TYPE_GST = "GST_REGISTRATION_CERTIFICATE"
DOC_TYPE_INCORPORATION = "CERTIFICATE_OF_INCORPORATION"
DOC_TYPE_COMPANIES_HOUSE = "COMPANIES_HOUSE_CERTIFICATE"

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# State transitions map
VALID_TRANSITIONS = {
    None: {TenantVerificationStatus.PENDING},
    TenantVerificationStatus.PENDING: {TenantVerificationStatus.APPROVED, TenantVerificationStatus.REJECTED},
    TenantVerificationStatus.REJECTED: {TenantVerificationStatus.PENDING},
    TenantVerificationStatus.APPROVED: {TenantVerificationStatus.SUSPENDED},
    TenantVerificationStatus.SUSPENDED: {TenantVerificationStatus.APPROVED},
}

def normalize_country(country_input: Optional[str]) -> str:
    """Normalize user input string to canonical country enum string."""
    if not country_input:
        return "INDIA"
    c_clean = country_input.strip().upper().replace(" ", "_")
    if c_clean in {"INDIA", "IN"}:
        return "INDIA"
    if c_clean in {"UNITED_KINGDOM", "UK", "UNITED_KINGDOM_GREAT_BRITAIN"}:
        return "UNITED_KINGDOM"
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported country '{country_input}'. Supported countries are: INDIA, UNITED_KINGDOM."
    )

def validate_state_transition(current_status: Optional[TenantVerificationStatus], target_status: TenantVerificationStatus):
    """Enforce state transition rules matrix."""
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state transition from '{current_status.value if current_status else 'NEW'}' to '{target_status.value}'."
        )

def validate_file(file: UploadFile, file_content: bytes):
    """Backend document file validation."""
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file '{file.filename}' is empty (0 bytes)."
        )
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size of '{file.filename}' exceeds maximum limit of 10 MB."
        )
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}' for '{file.filename}'. Allowed extensions: PDF, JPG, JPEG, PNG."
        )

    mime = (file.content_type or "").lower()
    if mime and mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{mime}' for '{file.filename}'. Allowed types: application/pdf, image/jpeg, image/png."
        )

def create_audit_entry(
    db: Session,
    tenant_id: UUID,
    action: str,
    performed_by: Optional[UUID],
    previous_status: Optional[str],
    new_status: Optional[str],
    rejection_reason: Optional[str] = None,
    meta_data: Optional[dict] = None
) -> AuditLog:
    """Helper to record audit logs for verification actions."""
    log = AuditLog(
        tenant_id=tenant_id,
        performed_by=performed_by,
        action=action,
        previous_status=previous_status,
        new_status=new_status,
        rejection_reason=rejection_reason,
        meta_data=meta_data or {}
    )
    db.add(log)
    return log

def invalidate_redis_verification_cache(tenant_id: UUID):
    """Invalidate or update verification status cache in Redis safely."""
    try:
        from app.utils.pubsub import redis_client
        if redis_client:
            redis_client.delete(f"tenant:{tenant_id}:verification")
    except Exception as e:
        print(f"[REDIS CACHE WARNING] Failed to invalidate verification cache for tenant {tenant_id}: {e}")

def save_verification_document(
    db: Session,
    tenant: Tenant,
    user: User,
    file: UploadFile,
    file_content: bytes,
    document_type: str
) -> Document:
    """Save document physically and create metadata record in Document model."""
    docs_dir = os.path.join(os.getcwd(), "uploads", "verification_docs")
    os.makedirs(docs_dir, exist_ok=True)

    ext = os.path.splitext(file.filename)[1].lower()
    safe_filename = f"tenant_{tenant.id}_{document_type.lower()}_{int(datetime.now().timestamp())}{ext}"
    file_path = os.path.join(docs_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    file_url = f"/uploads/verification_docs/{safe_filename}"
    mime = file.content_type or ("application/pdf" if ext == ".pdf" else "image/png")

    doc_record = Document(
        tenant_id=tenant.id,
        file_name=file.filename,
        file_url=file_url,
        status="COMPLETED",
        document_type=document_type,
        mime_type=mime,
        file_size=len(file_content),
        uploaded_by=user.id,
        verification_status="PENDING"
    )
    db.add(doc_record)
    return doc_record

def save_onboarding_verification_document(
    file: UploadFile,
    file_content: bytes,
    document_type: str,
    session_id: str = "onboarding"
) -> str:
    """Save document physically during onboarding and return the file_url."""
    docs_dir = os.path.join(os.getcwd(), "uploads", "verification_docs")
    os.makedirs(docs_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "doc.pdf")[1].lower()
    clean_session = "".join(c for c in session_id if c.isalnum())
    safe_filename = f"onboarding_{clean_session}_{document_type.lower()}_{int(datetime.now().timestamp())}{ext}"
    file_path = os.path.join(docs_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    return f"/uploads/verification_docs/{safe_filename}"

