# controllers/call_log_controller.py

from uuid import UUID
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.call_log import CallLog
from app.schemas.call_log_schema import CallLogCreate

def create_call_log(db: Session, call_log_in: CallLogCreate) -> CallLog:
    """Create a new CallLog record in the database."""
    db_call_log = CallLog(
        tenant_id=call_log_in.tenant_id,
        lead_id=call_log_in.lead_id,
        campaign_id=call_log_in.campaign_id,
        call_duration=call_log_in.call_duration,
        call_disposition=call_log_in.call_disposition,
        recording_url=call_log_in.recording_url,
        ai_summary=call_log_in.ai_summary,
        intent_tag=call_log_in.intent_tag,
        transcript=call_log_in.transcript
    )
    db.add(db_call_log)
    db.commit()
    db.refresh(db_call_log)
    return db_call_log

def get_call_logs(
    db: Session, 
    tenant_id: UUID, 
    campaign_id: Optional[UUID] = None,
    skip: int = 0, 
    limit: int = 100
) -> Tuple[List[CallLog], int]:
    """Retrieve call logs for a tenant, optionally filtered by campaign."""
    query = db.query(CallLog).filter(CallLog.tenant_id == tenant_id)
    
    if campaign_id:
        query = query.filter(CallLog.campaign_id == campaign_id)
        
    total = query.count()
    items = query.order_by(CallLog.created_at.desc()).offset(skip).limit(limit).all()
    return items, total

def get_call_log_by_id(db: Session, call_log_id: UUID, tenant_id: UUID) -> Optional[CallLog]:
    """Fetch a single CallLog by ID scoped to the tenant workspace."""
    return db.query(CallLog).filter(CallLog.id == call_log_id, CallLog.tenant_id == tenant_id).first()
