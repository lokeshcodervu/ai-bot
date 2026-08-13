# controllers/auth_controller.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timezone
from app.controllers import user_controller
from app.utils.helpers import verify_password, create_access_token, decode_access_token
from app.database.connection import get_db
from app.models.user_model import UserRole, BlacklistedToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def authenticate_user(db: Session, username_or_email: str, password: str):
    """Verify credentials. Checks both username and email columns."""
    if not username_or_email:
        return None
    clean_identifier = username_or_email.strip()
    # First search by username
    user = user_controller.get_user_by_username(db, clean_identifier)
    if not user:
        # fallback search by email
        user = user_controller.get_user_by_email(db, clean_identifier)
    
    if not user:
        return None
        
    if not verify_password(password, user.hashed_password):
        return None
        
    return user

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Dependency for authenticated endpoints. Decodes JWT, checks blacklist, and queries User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token is blacklisted
    is_blacklisted = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
    if is_blacklisted:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    user = user_controller.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
        
    return user

def blacklist_jwt_token(db: Session, token: str) -> bool:
    """Decode token to read expiry claim and save to BlacklistedToken."""
    payload = decode_access_token(token)
    if payload is None:
        return False
        
    exp = payload.get("exp")
    if exp:
        # Convert UTC timestamp to datetime object
        expires_at = datetime.fromtimestamp(exp, timezone.utc)
    else:
        # Fallback to 30 mins from now if no exp claim
        from datetime import timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        
    try:
        # Check if already blacklisted
        existing = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
        if not existing:
            db_blacklist = BlacklistedToken(
                token=token,
                expires_at=expires_at
            )
            db.add(db_blacklist)
            db.commit()
        return True
    except Exception:
        db.rollback()
        return False

def require_role(allowed_roles: list[UserRole]):
    """Enforce role checking. Returns a dependency function. SUPER_ADMIN gets full unrestricted access."""
    def role_dependency(current_user = Depends(get_current_user)):
        if current_user.role == UserRole.SUPER_ADMIN or current_user.role in allowed_roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this resource"
        )
    return role_dependency

def require_approved_tenant(current_user = Depends(get_current_user)):
    """
    Centralized Access Control Dependency:
    Ensures the company workspace is APPROVED by Super Admin before allowing business mutations.
    Super Admin users bypass this check.
    """
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user

    if not current_user.tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )

    from app.models.tenant import TenantVerificationStatus
    ver_status = current_user.tenant.verification_status

    if ver_status == TenantVerificationStatus.APPROVED:
        return current_user

    if ver_status == TenantVerificationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "COMPANY_VERIFICATION_REQUIRED",
                "status": "PENDING",
                "message": "Company verification is pending. Full access will be available after Super Admin approval."
            }
        )

    if ver_status == TenantVerificationStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "COMPANY_VERIFICATION_REJECTED",
                "status": "REJECTED",
                "message": "Company verification was rejected.",
                "rejection_reason": current_user.tenant.rejection_reason or "Invalid company documents or verification details provided."
            }
        )

    if ver_status == TenantVerificationStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "COMPANY_SUSPENDED",
                "status": "SUSPENDED",
                "message": "Company access has been suspended."
            }
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Company verification is required."
    )

# Alias for API specification consistency
require_approved_company = require_approved_tenant