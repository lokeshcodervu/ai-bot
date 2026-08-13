# routes/tenant_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Header
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import os
import shutil
import urllib.request
import urllib.error
import json
from typing import Optional, List
from datetime import datetime, timezone

from app.database.connection import get_db, SessionLocal
from app.config.settings import settings
from app.schemas.tenant_schema import (
    TenantOut, TenantUpdate, VoiceOut, VoiceSelectRequest, 
    SystemPromptRequest, SystemPromptResponse, TwilioLimitsRequest, VectorStatusOut,
    WalletRechargeRequest, WalletOut
)
from app.controllers import tenant_controller, auth_controller, user_controller
from app.models.user_model import User, UserRole
from app.models.document import Document
from app.models.tenant import Tenant, TenantVerificationStatus

router = APIRouter(prefix="/tenant", tags=["Tenant"])

def fetch_elevenlabs_voices() -> list:
    api_key = os.getenv("elevenlabs") or os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        # Fallback list of mock voices
        return [
            {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/previews"},
            {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Neha", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/previews"},
            {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/previews"},
            {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "gender": "male", "preview_url": "https://api.elevenlabs.io/v1/voices/ErXwobaYiN019PkySvjV/previews"}
        ]
    
    url = "https://api.elevenlabs.io/v1/voices"
    req = urllib.request.Request(url)
    req.add_header("xi-api-key", api_key)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            voices = []
            for voice in data.get("voices", []):
                voices.append({
                    "voice_id": voice.get("voice_id"),
                    "name": voice.get("name"),
                    "gender": voice.get("labels", {}).get("gender", "unknown"),
                    "preview_url": voice.get("preview_url") or ""
                })
            return voices
    except Exception as e:
        print(f"Error fetching ElevenLabs voices: {e}")
        # Return fallback mock list
        return [
            {"voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/21m00Tcm4TlvDq8ikWAM/previews"},
            {"voice_id": "AZnzlk1XvdvUeBnXmlld", "name": "Neha", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/previews"},
            {"voice_id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "gender": "female", "preview_url": "https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/previews"},
            {"voice_id": "ErXwobaYiN019PkySvjV", "name": "Antoni", "gender": "male", "preview_url": "https://api.elevenlabs.io/v1/voices/ErXwobaYiN019PkySvjV/previews"}
        ]

@router.get("/profile", response_model=TenantOut)
def get_tenant_profile(
    tenant_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Retrieve details of the active tenant profile."""
    # Resolve tenant_id
    target_tenant_id = current_user.tenant_id
    if current_user.role == UserRole.SUPER_ADMIN and tenant_id:
        target_tenant_id = tenant_id

    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant, and no tenant_id was provided."
        )

    db_tenant = tenant_controller.get_tenant_by_id(db, target_tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )
    return db_tenant

@router.patch("/profile", response_model=TenantOut)
def update_tenant_profile(
    tenant_in: TenantUpdate,
    tenant_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Update active tenant profile configurations (Requires BUSINESS_OWNER or SUPER_ADMIN)."""
    # Resolve tenant_id
    target_tenant_id = current_user.tenant_id
    if current_user.role == UserRole.SUPER_ADMIN and tenant_id:
        target_tenant_id = tenant_id

    if not target_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant, and no tenant_id was provided."
        )

    db_tenant = tenant_controller.get_tenant_by_id(db, target_tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )

    return tenant_controller.update_tenant(db, db_tenant, tenant_in)

@router.put("/profile", response_model=TenantOut)
def update_tenant_profile_put(
    tenant_in: TenantUpdate,
    tenant_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Update active tenant profile configurations (Requires BUSINESS_OWNER or SUPER_ADMIN) - PUT compatible."""
    return update_tenant_profile(tenant_in, tenant_id, db, current_user)

@router.get("/voices", response_model=List[VoiceOut])
def get_voices(
    db: Session = Depends(get_db),
    current_user: User = Depends(current_user_dep := auth_controller.get_current_user)
):
    """Retrieve details of premium AI voice models available from ElevenLabs or Sarvam AI."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
        
    db_tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if db_tenant and db_tenant.settings and isinstance(db_tenant.settings, dict) and db_tenant.settings.get("tts_provider") == "SARVAM":
        return [
            {"voice_id": "aditya", "name": "Aditya (Male)", "gender": "male", "preview_url": ""},
            {"voice_id": "saranya", "name": "Saranya (Female)", "gender": "female", "preview_url": ""},
            {"voice_id": "arvind", "name": "Arvind (Male)", "gender": "male", "preview_url": ""},
            {"voice_id": "geeta", "name": "Geeta (Female)", "gender": "female", "preview_url": ""},
            {"voice_id": "lokesh", "name": "Lokesh (Male)", "gender": "male", "preview_url": ""},
            {"voice_id": "nisha", "name": "Nisha (Female)", "gender": "female", "preview_url": ""}
        ]

    return fetch_elevenlabs_voices()

@router.post("/select-voice", response_model=TenantOut)
def select_voice_endpoint(
    request_in: VoiceSelectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Select ElevenLabs voice model for outbound calling."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
    db_tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )
    return tenant_controller.select_voice(db, db_tenant, request_in.voice_id)

@router.post("/upload-kb")
def upload_knowledge_base(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Upload PDF knowledge base files, save them locally, and trigger background chunking/embeddings vectorization."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
        
    db_tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )

    # Create upload folder
    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    uploaded_docs = []
    tasks_to_queue = []

    # Iterate and validate files
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type for '{file.filename}'. Only PDF files are allowed."
            )
            
        # Generate unique filename to avoid collision
        unique_id = uuid.uuid4()
        clean_filename = f"{unique_id}_{file.filename}"
        local_path = os.path.join(upload_dir, clean_filename)
        
        # Save file locally
        try:
            with open(local_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write file '{file.filename}' to disk: {str(e)}"
            )
            
        file_url = f"/uploads/{clean_filename}"
        
        # Store document record
        db_doc = Document(
            tenant_id=current_user.tenant_id,
            file_name=file.filename,
            file_url=file_url,
            status="PROCESSING"
        )
        db.add(db_doc)
        db.flush() # get generated ID
        
        uploaded_docs.append({
            "document_id": db_doc.id,
            "file_name": db_doc.file_name,
            "status": db_doc.status
        })
        tasks_to_queue.append((db_doc.id, local_path))

    # Commit records to DB first so background workers can see them
    db.commit()

    # Create dynamic sessionmaker bound to current session's engine
    from sqlalchemy.orm import sessionmaker
    engine = db.get_bind()
    db_session_factory = sessionmaker(bind=engine)

    # Queue background task for each uploaded file
    for doc_id, local_path in tasks_to_queue:
        background_tasks.add_task(
            tenant_controller.process_document_vectorization,
            db_session_factory,
            current_user.tenant_id,
            doc_id,
            local_path
        )

    return {
        "status": "success",
        "message": f"Successfully queued {len(uploaded_docs)} files for vectorization processing.",
        "documents": uploaded_docs
    }

@router.get("/vector-status", response_model=VectorStatusOut)
def get_vector_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """
    Polled API to retrieve knowledge base vectorization status:
    - PROCESSING: If any document is processing.
    - FAILED: If any has failed and none are processing.
    - COMPLETED: If all documents are completed.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )

    docs = db.query(Document).filter(Document.tenant_id == current_user.tenant_id).all()
    if not docs:
        return {"status": "FAILED"}

    status_counts = {"PROCESSING": 0, "COMPLETED": 0, "FAILED": 0}
    for doc in docs:
        if doc.status in status_counts:
            status_counts[doc.status] += 1
            
    if status_counts["PROCESSING"] > 0:
        return {"status": "PROCESSING"}
    elif status_counts["FAILED"] > 0:
        return {"status": "FAILED"}
    else:
        return {"status": "COMPLETED"}

@router.post("/system-prompt", response_model=SystemPromptResponse)
def set_system_prompt_endpoint(
    request_in: SystemPromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """
    Save custom system instructions. Only allowed after knowledge base vectorization is COMPLETED.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
        
    db_tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )

    # Validate vectorization is completed
    status_response = get_vector_status(db, current_user)
    if status_response["status"] != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System prompt configuration is locked until knowledge base vectorization is COMPLETED."
        )

    db_tenant_updated = tenant_controller.update_system_prompt(db, db_tenant, request_in.system_prompt)
    return {
        "system_prompt": db_tenant_updated.system_prompt,
        "system_prompt_version": db_tenant_updated.system_prompt_version
    }

@router.post("/twilio-limits", response_model=TenantOut)
def set_twilio_limits(
    request_in: TwilioLimitsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Configure Twilio outbound calling limits per second."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
        
    db_tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if not db_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found."
        )
        
    return tenant_controller.update_twilio_limits(db, db_tenant, request_in.twilio_max_calls_per_second)

from app.models.wallet import Wallet

@router.get("/wallet", response_model=WalletOut)
def get_wallet_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Retrieve the current wallet balance for the tenant (or master wallet for Super Admin)."""
    if not current_user.tenant_id:
        if current_user.role == UserRole.SUPER_ADMIN:
            return {"id": uuid.uuid4(), "tenant_id": uuid.uuid4(), "balance": 99999900, "currency": "INR"}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
    wallet = db.query(Wallet).filter(Wallet.tenant_id == current_user.tenant_id).first()
    if not wallet:
        if current_user.role == UserRole.SUPER_ADMIN:
            return {"id": uuid.uuid4(), "tenant_id": current_user.tenant_id or uuid.uuid4(), "balance": 99999900, "currency": "INR"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found for this tenant."
        )
    return wallet

@router.post("/wallet/recharge", response_model=WalletOut)
def recharge_wallet(
    request_in: WalletRechargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """Recharge tenant wallet (mocked for development/testing). Requires APPROVED company."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
    wallet = db.query(Wallet).filter(Wallet.tenant_id == current_user.tenant_id).first()
    if not wallet:
        wallet = Wallet(tenant_id=current_user.tenant_id, balance=0, currency="USD")
        db.add(wallet)
        db.flush()
        
    wallet.balance += request_in.amount
    db.commit()
    db.refresh(wallet)
    return wallet

# ---------------------------------------------------------
# COMPANY VERIFICATION & ACCESS CONTROL ENDPOINTS
# ---------------------------------------------------------
from fastapi import Form
from app.schemas.company_verification_schema import CompanyVerificationStatusOut
from app.services.company_verification_service import (
    normalize_country, validate_file, save_verification_document,
    save_onboarding_verification_document,
    create_audit_entry, invalidate_redis_verification_cache,
    DOC_TYPE_GST, DOC_TYPE_INCORPORATION, DOC_TYPE_COMPANIES_HOUSE
)
from app.models.tenant import TenantVerificationStatus
from app.models.user_model import BlacklistedToken
from app.utils.helpers import decode_access_token, create_access_token
from datetime import timedelta

def get_current_user_or_onboarding(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> dict:
    """Dependency supporting both logged-in User tokens and onboarding verified_tokens."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.split(" ")[1]

    # Check blacklist
    is_blacklisted = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
    if is_blacklisted:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    username = payload.get("sub")
    if username:
        user = user_controller.get_user_by_username(db, username)
        if user:
            return {"user": user, "payload": payload, "token": token, "is_onboarding": False}

    # Check if onboarding token (has otp_verified)
    if payload.get("otp_verified"):
        return {"user": None, "payload": payload, "token": token, "is_onboarding": True}

    raise credentials_exception

@router.get("/company-verification/status", response_model=CompanyVerificationStatusOut)
def get_company_verification_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Retrieve company verification status for frontend access control."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )

    tenant = tenant_controller.get_tenant_by_id(db, current_user.tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant workspace not found."
        )

    return CompanyVerificationStatusOut(
        status=tenant.verification_status.value if hasattr(tenant.verification_status, "value") else str(tenant.verification_status),
        country=tenant.country,
        company_name=tenant.company_name,
        company_email=tenant.company_email,
        phone_number=tenant.company_phone,
        owner_name=tenant.owner_name,
        registered_office_address=tenant.registered_address,
        company_number=tenant.company_number,
        submitted_at=tenant.submitted_at,
        rejection_reason=tenant.rejection_reason,
        verified_at=tenant.verified_at,
        verification_doc_url=tenant.verification_doc_url
    )

@router.post("/company-verification", response_model=CompanyVerificationStatusOut)
def submit_company_verification(
    country: str = Form("INDIA"),
    company_name: str = Form(...),
    company_email: str = Form(...),
    phone_number: str = Form(...),
    owner_name: str = Form(...),
    registered_office_address: str = Form(...),
    company_number: Optional[str] = Form(None),
    gst_doc: Optional[UploadFile] = File(None),
    incorporation_doc: Optional[UploadFile] = File(None),
    companies_house_doc: Optional[UploadFile] = File(None),
    verification_doc: Optional[UploadFile] = File(None),
    documents: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    auth_ctx: dict = Depends(get_current_user_or_onboarding)
):
    """
    Submit or Resubmit Company Verification details and documents.
    Supports both logged-in workspace Users and onboarding pre-registration sessions.
    """
    is_onboarding = auth_ctx["is_onboarding"]
    current_user = auth_ctx["user"]
    payload = auth_ctx["payload"]

    # Normalize & Validate Country
    norm_country = normalize_country(country)

    # Validate Common Required Text Fields
    if not company_name or not company_name.strip():
        raise HTTPException(status_code=400, detail="company_name is required.")
    if not company_email or not company_email.strip():
        raise HTTPException(status_code=400, detail="company_email is required.")
    if not phone_number or not phone_number.strip():
        raise HTTPException(status_code=400, detail="phone_number is required.")
    if not owner_name or not owner_name.strip():
        raise HTTPException(status_code=400, detail="owner_name is required.")
    if not registered_office_address or not registered_office_address.strip():
        raise HTTPException(status_code=400, detail="registered_office_address is required.")

    # Country Specific Validation
    if norm_country == "INDIA":
        has_gst = gst_doc is not None
        has_inc = incorporation_doc is not None or verification_doc is not None or (documents and len(documents) > 0)

        if not (has_gst or has_inc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="India company verification requires at least one document: GST Registration Certificate OR Certificate of Incorporation."
            )

    elif norm_country == "UNITED_KINGDOM":
        if not company_number or not company_number.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Companies House Company Number ('company_number') is required for United Kingdom companies."
            )

        has_uk_cert = companies_house_doc is not None or incorporation_doc is not None or verification_doc is not None or (documents and len(documents) > 0)
        if not has_uk_cert:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="United Kingdom company verification requires a Companies House Certificate of Incorporation."
            )

    # Collect files to process
    files_to_process = []
    if norm_country == "INDIA":
        if gst_doc: files_to_process.append((gst_doc, DOC_TYPE_GST))
        if incorporation_doc: files_to_process.append((incorporation_doc, DOC_TYPE_INCORPORATION))
        if verification_doc: files_to_process.append((verification_doc, DOC_TYPE_INCORPORATION))
        if documents:
            for doc in documents: files_to_process.append((doc, DOC_TYPE_INCORPORATION))
    elif norm_country == "UNITED_KINGDOM":
        if companies_house_doc: files_to_process.append((companies_house_doc, DOC_TYPE_COMPANIES_HOUSE))
        if incorporation_doc: files_to_process.append((incorporation_doc, DOC_TYPE_COMPANIES_HOUSE))
        if verification_doc: files_to_process.append((verification_doc, DOC_TYPE_COMPANIES_HOUSE))
        if documents:
            for doc in documents: files_to_process.append((doc, DOC_TYPE_COMPANIES_HOUSE))

    if is_onboarding:
        # ONBOARDING FLOW
        first_doc_url = None
        for upload_file, doc_type in files_to_process:
            content = upload_file.file.read()
            validate_file(upload_file, content)
            doc_url = save_onboarding_verification_document(
                upload_file, content, doc_type, payload.get("tenant_id", "onboarding")
            )
            if not first_doc_url:
                first_doc_url = doc_url

        # Create updated onboarding token payload
        verified_payload = payload.copy()
        verified_payload["country"] = norm_country
        verified_payload["company_name"] = company_name.strip()
        verified_payload["company_email"] = company_email.strip()
        verified_payload["company_phone"] = phone_number.strip()
        verified_payload["phone_number"] = phone_number.strip()
        verified_payload["owner_name"] = owner_name.strip()
        verified_payload["registered_address"] = registered_office_address.strip()
        verified_payload["registered_office_address"] = registered_office_address.strip()
        verified_payload["company_number"] = company_number.strip() if company_number else None
        if first_doc_url:
            verified_payload["verification_doc_url"] = first_doc_url
        verified_payload["verification_status"] = "PENDING"

        new_verified_token = create_access_token(data=verified_payload, expires_delta=timedelta(minutes=30))

        return CompanyVerificationStatusOut(
            status="PENDING",
            country=norm_country,
            company_name=company_name.strip(),
            company_email=company_email.strip(),
            phone_number=phone_number.strip(),
            owner_name=owner_name.strip(),
            registered_office_address=registered_office_address.strip(),
            company_number=company_number.strip() if company_number else None,
            submitted_at=datetime.now(timezone.utc),
            rejection_reason=None,
            verified_at=None,
            verification_doc_url=first_doc_url,
            verified_token=new_verified_token
        )

    else:
        # LOGGED IN USER FLOW
        if not current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with any tenant workspace."
            )

        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant workspace not found."
            )

        # Prevent duplicate submission if already pending
        if tenant.verification_status == TenantVerificationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company verification is already pending review. Duplicate submissions are not allowed while status is PENDING."
            )

        saved_docs = []
        for upload_file, doc_type in files_to_process:
            content = upload_file.file.read()
            validate_file(upload_file, content)
            doc_rec = save_verification_document(db, tenant, current_user, upload_file, content, doc_type)
            saved_docs.append(doc_rec)

        # Determine Previous & New Status
        prev_status = tenant.verification_status.value if hasattr(tenant.verification_status, "value") else str(tenant.verification_status)
        action_type = "RESUBMITTED" if prev_status == TenantVerificationStatus.REJECTED.value else "SUBMITTED"

        # Update Tenant DB fields
        tenant.country = norm_country
        tenant.company_name = company_name.strip()
        tenant.company_email = company_email.strip()
        tenant.company_phone = phone_number.strip()
        tenant.owner_name = owner_name.strip()
        tenant.registered_address = registered_office_address.strip()
        tenant.company_number = company_number.strip() if company_number else None

        if saved_docs:
            tenant.verification_doc_url = saved_docs[0].file_url

        now_utc = datetime.now(timezone.utc)
        tenant.verification_status = TenantVerificationStatus.PENDING
        tenant.submitted_at = now_utc
        tenant.rejection_reason = None

        # Log Audit Entry
        create_audit_entry(
            db=db,
            tenant_id=tenant.id,
            action=f"VERIFICATION_{action_type}",
            performed_by=current_user.id,
            previous_status=prev_status,
            new_status=TenantVerificationStatus.PENDING.value,
            rejection_reason=None,
            meta_data={"documents_uploaded": len(saved_docs)}
        )

        db.commit()
        db.refresh(tenant)

        # Redis Cache Update
        invalidate_redis_verification_cache(tenant.id)

        return CompanyVerificationStatusOut(
            status=tenant.verification_status.value if hasattr(tenant.verification_status, "value") else str(tenant.verification_status),
            country=tenant.country,
            company_name=tenant.company_name,
            company_email=tenant.company_email,
            phone_number=tenant.company_phone,
            owner_name=tenant.owner_name,
            registered_office_address=tenant.registered_address,
            company_number=tenant.company_number,
            submitted_at=tenant.submitted_at,
            rejection_reason=tenant.rejection_reason,
            verified_at=tenant.verified_at,
            verification_doc_url=tenant.verification_doc_url
        )



