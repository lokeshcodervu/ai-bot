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
from app.models import Tenant, User, UserRole, Plan, Payment, Subscription
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
    otp_code = "0000" # Static OTP for development
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
    
    # Store temporary state in signup_token
    tenant_id = uuid.uuid4()
    signup_payload = {
        "username": username,
        "email": user_in.email,
        "hashed_password": hash_password(user_in.password),
        "role": UserRole.BUSINESS_OWNER.value,
        "tenant_id": str(tenant_id),
        "company_name": f"{username.capitalize()} Workspace",
        "company_slug": slug_candidate,
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
            "role": UserRole.BUSINESS_OWNER
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
        
    otp_code = "0000"
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

@router.post("/select-industry", response_model=Token)
def select_industry(request_in: SelectIndustryRequest, db: Session = Depends(get_db)):
    """Select Industry (Stage 3). Creates Tenant and User records in database and logs in."""
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
        
    username = payload.get("username")
    email = payload.get("email")
    phone_number = payload.get("phone_number")
    
    # Double check database constraints
    if user_controller.get_user_by_username(db, username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
        
    if user_controller.get_user_by_email(db, email) or db.query(Tenant).filter(Tenant.company_email == email, Tenant.is_deleted == False).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Baseline prompt mapping
    INDUSTRY_PROMPTS = {
        "IT Training": "You are a professional sales assistant for an IT Training company. Answer questions about course curriculums, pricing, and scheduling.",
        "Real Estate": "You are a professional real estate sales assistant. Answer questions about property listings, pricing, and scheduling viewings.",
        "Healthcare": "You are a professional healthcare assistant. Assist with appointment scheduling and answering general service questions.",
        "Finance": "You are a professional financial services assistant. Assist with product inquiries and consultation scheduling.",
        "E-commerce": "You are a professional e-commerce sales assistant. Assist with product details, order statuses, and support.",
        "Insurance": "You are a professional insurance sales assistant. Answer questions about policies, premium pricing, claims, and scheduling consultations.",
    }
    
    baseline_prompt = "You are a helpful AI sales assistant."
    if request_in.industry in INDUSTRY_PROMPTS:
        baseline_prompt = INDUSTRY_PROMPTS[request_in.industry]
        
    # Create Tenant via controller (this auto-creates Wallet and TenantUsage)
    tenant_create_data = TenantCreate(
        company_name=payload["company_name"],
        slug=payload["company_slug"],
        company_email=email,
        company_phone=phone_number,
        industry=request_in.industry
    )
    
    # We create the tenant using controller and specify the pre-generated tenant_id
    db_tenant = tenant_controller.create_tenant(db, tenant_create_data, tenant_id=uuid.UUID(payload["tenant_id"]))
    
    # We update prompt, verified and active status
    db_tenant.system_prompt = baseline_prompt
    db_tenant.is_verified = True
    db_tenant.is_active = False
    db_tenant.is_payment_done = False
        
    # Create User
    db_user = User(
        username=username,
        email=email,
        hashed_password=payload["hashed_password"],
        full_name=payload.get("full_name"),
        phone_number=phone_number,
        role=UserRole(payload["role"]),
        tenant_id=db_tenant.id,
        is_active=True
    )
    db.add(db_user)
    
    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error during creation: {str(e)}"
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
