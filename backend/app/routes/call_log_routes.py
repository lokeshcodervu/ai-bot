# routes/call_log_routes.py

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.controllers import auth_controller, call_log_controller
from app.models.user_model import User, UserRole
from app.schemas.call_log_schema import CallLogOut

router = APIRouter(prefix="/call-logs", tags=["Call Logs"])

def require_payment(current_user: User = Depends(auth_controller.get_current_user)):
    """Gate checks to ensure tenant has active payment done before accessing Call Logs API. Super Admin bypasses."""
    if current_user.role == UserRole.SUPER_ADMIN:
        return current_user
    if not current_user.tenant or not current_user.tenant.is_payment_done:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Subscription payment required to access Call Logs."
        )
    return current_user

@router.get("", response_model=List[CallLogOut])
def get_call_logs_endpoint(
    campaign_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """Retrieve paginated call logs for the tenant workspace (or all call logs for Super Admin)."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        if current_user.role == UserRole.SUPER_ADMIN:
            from app.models.call_log import CallLog
            return db.query(CallLog).offset(skip).limit(limit).all()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    items, _ = call_log_controller.get_call_logs(db, tenant_id, campaign_id, skip, limit)
    return items

@router.get("/{call_log_id}", response_model=CallLogOut)
def get_call_log_detail_endpoint(
    call_log_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """Retrieve detailed information of a specific call log including simulated transcript and recording."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
        
    db_call_log = call_log_controller.get_call_log_by_id(db, call_log_id, tenant_id)
    if not db_call_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call log not found or access denied."
        )
    return db_call_log
