# schemas/call_log_schema.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict, Any

class CallLogBase(BaseModel):
    call_duration: int
    call_disposition: str
    recording_url: Optional[str] = None
    ai_summary: Optional[str] = None
    intent_tag: Optional[str] = None
    transcript: Optional[List[Dict[str, Any]]] = None

class CallLogCreate(CallLogBase):
    tenant_id: UUID
    lead_id: UUID
    campaign_id: Optional[UUID] = None

class CallLogOut(CallLogBase):
    id: UUID
    tenant_id: UUID
    lead_id: UUID
    campaign_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
