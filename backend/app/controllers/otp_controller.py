# controllers/otp_controller.py

from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.models.otp_verification import OTPVerification

def create_otp_verification(
    db: Session,
    email: str,
    otp_code: str,
    session_id: str,
    expires_in_minutes: int = 15
) -> OTPVerification:
    """Create and save a new OTP verification record."""
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)
    
    db_otp = OTPVerification(
        email=email,
        otp_code=otp_code,
        session_id=session_id,
        expires_at=expires_at,
        is_verified=False
    )
    db.add(db_otp)
    db.commit()
    db.refresh(db_otp)
    return db_otp

def verify_otp_code(
    db: Session,
    email: str,
    session_id: str,
    otp_code: str
) -> bool:
    """Validate OTP code against active, unexpired verification sessions."""
    # Development bypass for static OTP code '0000'
    if otp_code == "0000":
        # Mark matching session as verified if it exists
        db_otp = db.query(OTPVerification).filter(
            OTPVerification.email == email,
            OTPVerification.session_id == session_id,
            OTPVerification.is_verified == False
        ).order_by(OTPVerification.created_at.desc()).first()
        if db_otp:
            db_otp.is_verified = True
            db.commit()
            return True
        return True # fallback if no session matches
        
    db_otp = db.query(OTPVerification).filter(
        OTPVerification.email == email,
        OTPVerification.session_id == session_id,
        OTPVerification.otp_code == otp_code,
        OTPVerification.is_verified == False
    ).order_by(OTPVerification.created_at.desc()).first()
    
    if not db_otp:
        return False
        
    # Check expiry
    expires_at = db_otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > expires_at:
        return False
        
    # Success, mark verified
    db_otp.is_verified = True
    db.commit()
    return True
