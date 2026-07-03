# routes/tenant_routes.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
import uuid
import os
import shutil
import urllib.request
import urllib.error
import json
from typing import Optional, List

from app.database.connection import get_db, SessionLocal
from app.config.settings import settings
from app.schemas.tenant_schema import (
    TenantOut, TenantUpdate, VoiceOut, VoiceSelectRequest, 
    SystemPromptRequest, SystemPromptResponse, TwilioLimitsRequest, VectorStatusOut,
    WalletRechargeRequest, WalletOut
)
from app.controllers import tenant_controller, auth_controller
from app.models.user_model import User, UserRole
from app.models.document import Document

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
    """Retrieve the current wallet balance for the tenant."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant."
        )
    wallet = db.query(Wallet).filter(Wallet.tenant_id == current_user.tenant_id).first()
    if not wallet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wallet not found for this tenant."
        )
    return wallet

@router.post("/wallet/recharge", response_model=WalletOut)
def recharge_wallet(
    request_in: WalletRechargeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_role([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]))
):
    """Recharge tenant wallet (mocked for development/testing)."""
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

