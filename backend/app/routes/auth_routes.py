# routes/auth_routes.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone
import secrets

from app.database.connection import get_db
from app.schemas import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    Token,
    UserOut
)
from app.controllers import user_controller, auth_controller
from app.utils.helpers import create_access_token, decode_access_token, hash_password
from app.models.user_model import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate credentials and return a JWT access token containing tenant and role claims."""
    user = auth_controller.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active."
        )
        
    access_token = create_access_token(
        data={
            "sub": user.username,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role.value
        }
    )
    refresh_token = create_access_token(
        data={
            "sub": user.username,
            "type": "refresh"
        },
        expires_delta=timedelta(days=7)
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request_in: Token, db: Session = Depends(get_db)):
    """Accept a valid refresh token and generate a new access/refresh token pair."""
    # We use RefreshTokenRequest model, but we can reuse Token model
    payload = decode_access_token(request_in.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )
        
    username: str = payload.get("sub")
    user = user_controller.get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )
        
    access_token = create_access_token(
        data={
            "sub": user.username,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "role": user.role.value
        }
    )
    new_refresh_token = create_access_token(
        data={
            "sub": user.username,
            "type": "refresh"
        },
        expires_delta=timedelta(days=7)
    )
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout_user(
    token: str = Depends(auth_controller.oauth2_scheme),
    db: Session = Depends(get_db),
    current_user = Depends(auth_controller.get_current_user)
):
    """Blacklist the active JWT access token to invalidate the session."""
    success = auth_controller.blacklist_jwt_token(db, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to logout. Token is invalid or expired."
        )
    return {"status": "success", "message": "Successfully logged out."}

@router.post("/forgot-password")
def forgot_password(request_in: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a password reset token and store it on the user record."""
    user = user_controller.get_user_by_email(db, request_in.email)
    success_response = {
        "status": "success",
        "message": "If the email is registered, instructions to reset password have been sent."
    }
    if not user:
        return success_response
        
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    user_controller.save_reset_token(db, user, token, expires_at)
    
    print(f"MOCK EMAIL: Click here to reset your password: http://localhost:3000/reset-password?token={token}")
    
    return success_response

@router.post("/reset-password")
def reset_password(request_in: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate token and update user password."""
    user = user_controller.get_user_by_reset_token(db, request_in.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    if user.reset_token_expires_at:
        expires_at = user.reset_token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expires_at:
            user_controller.clear_reset_token(db, user)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired."
            )
            
    user.hashed_password = hash_password(request_in.new_password)
    user.password_changed_at = func.now()
    user_controller.clear_reset_token(db, user)
    
    return {"status": "success", "message": "Password has been successfully updated."}

# Dashboard router
dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

REAL_ESTATE_DASHBOARD_DATA = {
    "industry": "Real Estate",
    "leads_count": 42,
    "active_campaigns": 3,
    "scheduled_site_visits": 8,
    "listings": [
        {"id": 1, "title": "Luxury 3 BHK Apartment", "price": "$150,000", "status": "Available"},
        {"id": 2, "title": "Modern Suburban Villa", "price": "$320,000", "status": "Pending"},
        {"id": 3, "title": "Commercial Office Space", "price": "$85,000", "status": "Sold"}
    ],
    "recent_leads": [
        {"name": "Rahul Sharma", "phone": "+91 98765 43210", "requirement": "Looking for 2BHK near Metro"},
        {"name": "Amit Verma", "phone": "+91 87654 32109", "requirement": "Villa with private pool"}
    ]
}

INSURANCE_DASHBOARD_DATA = {
    "industry": "Insurance",
    "leads_count": 68,
    "active_campaigns": 5,
    "claims_processed": 14,
    "policies": [
        {"id": 1, "title": "Term Life Insurance", "premium": "$50/mo", "status": "Active"},
        {"id": 2, "title": "Comprehensive Health Cover", "premium": "$120/mo", "status": "Active"},
        {"id": 3, "title": "Zero Depreciation Car Insurance", "premium": "$40/mo", "status": "Inactive"}
    ],
    "recent_leads": [
        {"name": "Neha Patel", "phone": "+91 76543 21098", "requirement": "Health Insurance for Family of 4"},
        {"name": "Vikram Singh", "phone": "+91 65432 10987", "requirement": "Car Insurance Renewal quote"}
    ]
}

@dashboard_router.get("")
def read_dashboard(
    current_user: User = Depends(auth_controller.get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve dashboard data. Gated by payment success."""
    if not current_user.tenant or not current_user.tenant.is_payment_done:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription payment required to access the dashboard."
        )
        
    plan_type = "BASIC"
    if current_user.tenant.subscription:
        plan_type = current_user.tenant.subscription.plan_id.upper()
        
    from app.models.lead import Lead
    from app.models.call_log import CallLog
    from app.models.campaign import Campaign, CampaignStatus

    db_leads_count = db.query(Lead).filter(Lead.tenant_id == current_user.tenant_id).count()
    db_calls_count = db.query(CallLog).filter(CallLog.tenant_id == current_user.tenant_id).count()
    db_answered_count = db.query(CallLog).filter(
        CallLog.tenant_id == current_user.tenant_id, 
        CallLog.call_disposition == "Answered"
    ).count()
    db_active_campaigns = db.query(Campaign).filter(
        Campaign.tenant_id == current_user.tenant_id,
        Campaign.status == CampaignStatus.ACTIVE
    ).count()
    
    connection_rate = round((db_answered_count / db_calls_count) * 100, 2) if db_calls_count > 0 else 0.0

    industry = current_user.tenant.industry
    if industry == "Real Estate":
        industry_data = REAL_ESTATE_DASHBOARD_DATA.copy()
        if db_leads_count > 0:
            industry_data["leads_count"] = db_leads_count
            industry_data["active_campaigns"] = db_active_campaigns
            industry_data["total_calls"] = db_calls_count
            industry_data["connection_rate"] = f"{connection_rate}%"
    elif industry == "Insurance":
        industry_data = INSURANCE_DASHBOARD_DATA.copy()
        if db_leads_count > 0:
            industry_data["leads_count"] = db_leads_count
            industry_data["active_campaigns"] = db_active_campaigns
            industry_data["total_calls"] = db_calls_count
            industry_data["connection_rate"] = f"{connection_rate}%"
    else:
        # Fallback default dashboard data for other industries
        industry_data = {
            "industry": industry or "General",
            "leads_count": db_leads_count,
            "active_campaigns": db_active_campaigns,
            "total_calls": db_calls_count,
            "connection_rate": f"{connection_rate}%",
            "recent_leads": []
        }
        
    return {
        "status": "success",
        "message": "Welcome to the AI-BOT SaaS Dashboard!",
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "full_name": current_user.full_name
        },
        "tenant": {
            "company_name": current_user.tenant.company_name,
            "plan_type": plan_type,
            "is_payment_done": current_user.tenant.is_payment_done,
            "industry": industry,
            "industry_data": industry_data
        }
    }

