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
    # First search by username
    user = user_controller.get_user_by_username(db, username_or_email)
    if not user:
        # fallback search by email
        user = user_controller.get_user_by_email(db, username_or_email)
    
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
    """Enforce role checking. Returns a dependency function."""
    def role_dependency(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access this resource"
            )
        return current_user
    return role_dependency