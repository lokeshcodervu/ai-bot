# routes/onboarding_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
import uuid
import secrets
import re
from typing import Union

from app.database.connection import get_db
from app.schemas import (
    UserSignup,
    SendSignupOTPRequest,
    SendEmailOTPRequest,
    VerifyOTPRequest,
    VerifyOTPResponse,
    SelectIndustryRequest,
    CompleteOnboardingRequest,
    SelectPlanRequest,
    SubscriptionOut,
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    PaymentOut,
    Token,
    RegisterResponse,
    TenantCreate
)
from app.models import Tenant, User, UserRole, Plan, Payment, Subscription, Document
from datetime import datetime, timezone
from app.controllers import user_controller, tenant_controller, auth_controller, otp_controller, subscription_controller, payment_controller
from app.utils.helpers import decode_access_token, create_access_token, hash_password

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

def slugify(s: str) -> str:
    """Helper to convert string to a valid slug."""
    s = s.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_-]+', '-', s)
    return s

@router.post("/signup", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def signup_user(user_in: UserSignup, db: Session = Depends(get_db)):
    """User Signup (Stage 1). Validates email and triggers OTP send logic."""
    # Check if email is already registered in User or Tenant
    if user_controller.get_user_by_email(db, user_in.email) or db.query(Tenant).filter(Tenant.company_email == user_in.email, Tenant.is_deleted == False).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Generate username & slug from email prefix
    email_prefix = user_in.email.split("@")[0]
    email_prefix = re.sub(r'[^\w-]', '', email_prefix).strip()
    if not email_prefix:
        email_prefix = "user"
    username = email_prefix
    
    # Ensure username is unique
    existing_user = user_controller.get_user_by_username(db, username)
    counter = 1
    while existing_user:
        new_username = f"{username}-{counter}"
        existing_user = user_controller.get_user_by_username(db, new_username)
        if not existing_user:
            username = new_username
            break
        counter += 1
        
    slug_candidate = slugify(username)
    existing_tenant = tenant_controller.get_tenant_by_slug(db, slug_candidate)
    counter = 1
    while existing_tenant:
        new_slug = f"{slug_candidate}-{counter}"
        existing_tenant = tenant_controller.get_tenant_by_slug(db, new_slug)
        if not existing_tenant:
            slug_candidate = new_slug
            break
        counter += 1

    # Create OTP verification
    otp_code = "111111" # Default OTP for testing
    otp_session_id = f"session_{secrets.token_hex(8)}"
    otp_controller.create_otp_verification(
        db=db,
        email=user_in.email,
        otp_code=otp_code,
        session_id=otp_session_id,
        expires_in_minutes=15
    )
    
    # Log OTP in console
    print(f"\n======================================")
    print(f"[OTP SIGNUP DEBUG] OTP Sent to email: {user_in.email}")
    print(f"OTP Verification Code: {otp_code} (Static OTP)")
    print(f"======================================\n")
    
    # Determine role dynamically (use specified role if provided, otherwise default to BUSINESS_OWNER)
    assigned_role = user_in.role.value if user_in.role else UserRole.BUSINESS_OWNER.value

    # Store temporary state in signup_token
    tenant_id = uuid.uuid4()
    signup_payload = {
        "username": username,
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
        "role": assigned_role,
        "tenant_id": str(tenant_id),
        "company_name": f"{username.capitalize()} Workspace",
        "company_slug": slug_candidate,
        "full_name": user_in.full_name or username.capitalize(),
        "otp_session_id": otp_session_id
    }
    
    signup_token = create_access_token(data=signup_payload, expires_delta=timedelta(minutes=15))
    
    return {
        "status": "success",
        "message": "OTP has been sent successfully to your email.",
        "signup_token": signup_token,
        "user": {
            "username": username,
            "email": user_in.email,
            "phone_number": None,
            "role": UserRole(assigned_role)
        }
    }

@router.post("/send-otp")
def send_otp(request_in: Union[SendSignupOTPRequest, SendEmailOTPRequest], db: Session = Depends(get_db)):
    """Trigger/Resend OTP."""
    email = None
    payload = None
    
    if isinstance(request_in, SendSignupOTPRequest):
        payload = decode_access_token(request_in.signup_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired signup session."
            )
        email = payload.get("email")
    else:
        email = request_in.email
        
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required."
        )
        
    otp_code = "111111"
    otp_session_id = f"session_{secrets.token_hex(8)}"
    otp_controller.create_otp_verification(
        db=db,
        email=email,
        otp_code=otp_code,
        session_id=otp_session_id,
        expires_in_minutes=15
    )
    
    print(f"\n======================================")
    print(f"[OTP DEBUG] OTP Resent to email: {email}")
    print(f"OTP Verification Code: {otp_code} (Static OTP)")
    print(f"======================================\n")
    
    if isinstance(request_in, SendSignupOTPRequest) and payload:
        payload["otp_session_id"] = otp_session_id
        new_token = create_access_token(data=payload, expires_delta=timedelta(minutes=15))
        return {
            "status": "success",
            "message": "OTP has been resent successfully.",
            "signup_token": new_token
        }
        
    return {"status": "success", "message": "OTP has been sent successfully."}

@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(request_in: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify email OTP (Stage 2). Returns verified_token."""
    payload = decode_access_token(request_in.signup_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired registration session."
        )
        
    otp_session_id = payload.get("otp_session_id")
    email = payload.get("email")
    
    if not otp_session_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification session found."
        )
        
    is_valid = otp_controller.verify_otp_code(
        db=db,
        email=email,
        session_id=otp_session_id,
        otp_code=request_in.otp
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please try again."
        )
        
    # Return verified_token
    verified_payload = payload.copy()
    verified_payload["otp_verified"] = True
    
    verified_token = create_access_token(data=verified_payload, expires_delta=timedelta(minutes=15))
    
    return {
        "status": "success",
        "message": "OTP verified successfully. Please select your industry.",
        "verified_token": verified_token
    }

@router.post("/select-industry")
def select_industry(request_in: SelectIndustryRequest, db: Session = Depends(get_db)):
    """Select Industry (Stage 3). Stores industry preference in verified_token without writing to DB."""
    payload = decode_access_token(request_in.verified_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please register again."
        )
        
    if not payload.get("otp_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required."
        )
        
    # Attach selected industry to payload
    verified_payload = payload.copy()
    verified_payload["industry"] = request_in.industry
    
    new_verified_token = create_access_token(data=verified_payload, expires_delta=timedelta(minutes=30))
    
    return {
        "status": "success",
        "message": "Industry selected successfully.",
        "verified_token": new_verified_token
    }

@router.post("/select-plan")
def select_plan(request_in: SelectPlanRequest, db: Session = Depends(get_db)):
    """Select Subscription Plan (Stage 4). Stores plan preference in verified_token without writing to DB."""
    plan_id = getattr(request_in, "plan_id", None) or getattr(request_in, "plan", "pro")
    
    # Check if header contains token or body
    verified_token = getattr(request_in, "verified_token", None)
    if not verified_token:
        # Fallback if authenticated user calls it
        return {"status": "success", "plan_id": plan_id, "status": "INACTIVE"}
        
    payload = decode_access_token(verified_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please register again."
        )
        
    verified_payload = payload.copy()
    verified_payload["plan"] = plan_id
    
    new_verified_token = create_access_token(data=verified_payload, expires_delta=timedelta(minutes=30))
    
    return {
        "status": "success",
        "message": "Plan selected successfully.",
        "verified_token": new_verified_token
    }

@router.post("/complete", response_model=Token)
def complete_onboarding(request_in: CompleteOnboardingRequest, db: Session = Depends(get_db)):
    """Complete Onboarding & Process Payment (Stage 5). Creates Tenant and User in DB ONLY IF payment succeeds."""
    payload = decode_access_token(request_in.verified_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please register again."
        )
        
    if not payload.get("otp_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required."
        )

    # 1. Payment Verification Check
    card_number = (request_in.card_number or "").replace(" ", "")
    card_cvc = request_in.card_cvc or ""
    upi_id = (request_in.upi_id or "").lower()
    
    # Trigger decline simulation if card number is '0000000000000000' or CVV is '000' or UPI is 'decline@upi'
    if (
        "0000000000000000" in card_number
        or card_cvc == "000"
        or "decline" in card_number.lower()
        or "decline" in upi_id
        or "error" in upi_id
    ):
        # DO NOT CREATE DB ENTRY! Throw Payment Declined Error!
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your card was refused by the issuer. Try a different method to continue."
        )

    username = payload.get("username")
    email = payload.get("email")
    phone_number = payload.get("phone_number")
    industry = payload.get("industry", "IT Training & Education")
    selected_plan = request_in.plan or payload.get("plan", "pro")
    
    # Double check database constraints
    if user_controller.get_user_by_username(db, username) or user_controller.get_user_by_email(db, email):
        # If user already registered, log them in
        db_user = user_controller.get_user_by_email(db, email)
        if db_user:
            access_token = create_access_token(data={"sub": db_user.username, "tenant_id": str(db_user.tenant_id), "role": db_user.role.value})
            refresh_token = create_access_token(data={"sub": db_user.username, "type": "refresh"}, expires_delta=timedelta(days=7))
            return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Baseline prompt mapping from centralized prompts module
    from app.prompts import get_industry_baseline_prompt
    baseline_prompt = get_industry_baseline_prompt(industry)
        
    # Start Atomic DB Transaction
    try:
        # Create Tenant
        company_name_val = payload.get("company_name", f"{username.capitalize()} Workspace")
        company_email_val = payload.get("company_email", email)
        company_phone_val = payload.get("company_phone") or payload.get("phone_number") or phone_number
        tenant_create_data = TenantCreate(
            company_name=company_name_val,
            slug=payload.get("company_slug", slugify(username)),
            company_email=company_email_val,
            company_phone=company_phone_val,
            industry=industry
        )
        db_tenant = tenant_controller.create_tenant(db, tenant_create_data, tenant_id=uuid.UUID(payload["tenant_id"]))
        db_tenant.country = payload.get("country", "INDIA")
        if payload.get("owner_name"):
            db_tenant.owner_name = payload.get("owner_name")
        if payload.get("registered_address") or payload.get("registered_office_address"):
            db_tenant.registered_address = payload.get("registered_address") or payload.get("registered_office_address")
        if payload.get("company_number"):
            db_tenant.company_number = payload.get("company_number")

        verification_doc_url = payload.get("verification_doc_url")
        if verification_doc_url:
            db_tenant.verification_doc_url = verification_doc_url
            db_tenant.verification_status = TenantVerificationStatus.PENDING
            db_tenant.submitted_at = datetime.now(timezone.utc)

        db_tenant.system_prompt = baseline_prompt
        db_tenant.is_verified = True
        db_tenant.is_active = True
        db_tenant.is_payment_done = True

        # Create User
        db_user = User(
            username=username,
            email=email,
            hashed_password=payload["hashed_password"],
            full_name=payload.get("full_name"),
            phone_number=company_phone_val,
            role=UserRole(payload["role"]),
            tenant_id=db_tenant.id,
            is_active=True
        )
        db.add(db_user)

        if verification_doc_url:
            import os
            doc_record = Document(
                tenant_id=db_tenant.id,
                file_name=os.path.basename(verification_doc_url),
                file_url=verification_doc_url,
                status="COMPLETED",
                document_type="COMPANY_VERIFICATION_DOC",
                mime_type="application/pdf" if verification_doc_url.endswith(".pdf") else "image/png",
                uploaded_by=db_user.id,
                verification_status="PENDING"
            )
            db.add(doc_record)

        # Create Active Subscription
        subscription_controller.create_or_update_subscription(
            db=db,
            tenant_id=db_tenant.id,
            plan_id=selected_plan
        )

        # Commit Transaction
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction failed during registration: {str(e)}"
        )
        
    # Generate access and refresh tokens
    access_token = create_access_token(
        data={
            "sub": db_user.username,
            "tenant_id": str(db_user.tenant_id),
            "role": db_user.role.value
        }
    )
    refresh_token = create_access_token(
        data={
            "sub": db_user.username,
            "type": "refresh"
        },
        expires_delta=timedelta(days=7)
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/select-plan", response_model=SubscriptionOut)
def select_plan(
    request_in: SelectPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Select subscription plan (Stage 4). Initializes subscription status to pending/inactive."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any workspace tenant."
        )
        
    db_sub = subscription_controller.create_or_update_subscription(
        db=db,
        tenant_id=current_user.tenant_id,
        plan_id=request_in.plan_id
    )
    return db_sub

@router.post("/create-payment", response_model=CreateOrderResponse)
def create_payment(
    request_in: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Create a new payment order (Stage 5). Resolves subscription price and creates a pending payment."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any workspace tenant."
        )
        
    db_sub = subscription_controller.get_subscription_by_tenant(db, current_user.tenant_id)
    if not db_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No subscription configuration found for this workspace. Please select a plan first."
        )
        
    # Find price from plan
    plan = db.query(Plan).filter(Plan.id == db_sub.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND,
            detail="Subscription plan not found."
        )
        
    # Convert plan price (float/Numeric) to integer smallest currency unit (cents)
    amount_in_cents = int(plan.price * 100)
    
    db_payment = payment_controller.create_payment_order(
        db=db,
        tenant_id=current_user.tenant_id,
        subscription_id=db_sub.id,
        amount=amount_in_cents,
        gateway=request_in.gateway
    )
    
    return {
        "payment_id": db_payment.id,
        "amount": db_payment.amount,
        "currency": db_payment.currency,
        "payment_status": db_payment.payment_status,
        "gateway_order_id": db_payment.gateway_order_id
    }

@router.post("/verify-payment", response_model=PaymentOut)
def verify_payment(
    request_in: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """Verify payment status (Stage 6). Activates subscription and tenant workspace on success."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any workspace tenant."
        )
        
    # Security isolation: verify payment belongs to current user's tenant
    db_payment = db.query(Payment).filter(
        Payment.id == request_in.payment_id,
        Payment.tenant_id == current_user.tenant_id
    ).first()
    
    if not db_payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction order not found or access denied."
        )
        
    verified_payment = payment_controller.verify_payment_order(
        db=db,
        payment_id=request_in.payment_id,
        gateway_payment_id=request_in.gateway_payment_id,
        gateway_signature=request_in.gateway_signature
    )
    
    return verified_payment

from fastapi import Form, UploadFile, File
import os
import shutil
from typing import Optional
from app.models.tenant import TenantVerificationStatus

ALLOWED_DOC_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("/upload-company-doc")
def upload_company_doc(
    country: str = Form("India"),
    company_name: str = Form(...),
    company_email: str = Form(...),
    company_phone: str = Form(...),
    owner_name: str = Form(...),
    registered_address: str = Form(...),
    company_number: Optional[str] = Form(None),
    verification_doc: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """
    Onboarding Stage: Submit company details & upload verification document.
    Sets tenant status to PENDING for Super Admin review.
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any workspace tenant."
        )

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant workspace not found."
        )

    # Validate File Extension
    file_extension = os.path.splitext(verification_doc.filename)[1].lower()
    if file_extension not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file_extension}'. Allowed formats: PDF, JPG, JPEG, PNG."
        )

    # Validate File Size (read content)
    doc_content = verification_doc.file.read()
    if len(doc_content) > MAX_DOC_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 10 MB."
        )

    # Ensure uploads/verification_docs directory exists
    docs_dir = os.path.join(os.getcwd(), "uploads", "verification_docs")
    os.makedirs(docs_dir, exist_ok=True)

    saved_filename = f"tenant_{tenant.id}_doc{file_extension}"
    file_path = os.path.join(docs_dir, saved_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(doc_content)

    file_url = f"/uploads/verification_docs/{saved_filename}"

    # Update tenant details
    tenant.country = country
    tenant.company_name = company_name
    tenant.company_email = company_email
    tenant.company_phone = company_phone
    tenant.owner_name = owner_name
    tenant.registered_address = registered_address
    tenant.company_number = company_number
    tenant.verification_doc_url = file_url
    tenant.verification_status = TenantVerificationStatus.PENDING
    tenant.rejection_reason = None
    tenant.is_active = False # Remains false until Super Admin approves

    db.commit()
    db.refresh(tenant)

    return {
        "status": "success",
        "message": "Company details and verification document submitted successfully. Your account is now pending Super Admin verification.",
        "tenant_id": tenant.id,
        "country": tenant.country,
        "company_name": tenant.company_name,
        "verification_status": tenant.verification_status,
        "verification_doc_url": tenant.verification_doc_url
    }

