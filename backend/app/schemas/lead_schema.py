# schemas/lead_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List, Dict, Any
from app.models.lead import LeadStatus

class LeadBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=7, max_length=50)
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    tenant_id: UUID
    status: Optional[LeadStatus] = LeadStatus.IMPORTED
    campaign_id: Optional[UUID] = None

class LeadImportItem(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class LeadImportRequest(BaseModel):
    leads: List[LeadImportItem] = Field(..., min_length=1)

class LeadImportResultItem(BaseModel):
    name: str
    phone: str
    error: str

class LeadImportResponse(BaseModel):
    status: str
    total_received: int
    total_imported: int
    total_failed: int
    imported_leads: List[UUID]
    failed_leads: List[LeadImportResultItem]

class LeadOut(LeadBase):
    id: UUID
    tenant_id: UUID
    status: LeadStatus
    campaign_id: Optional[UUID] = None
    call_disposition: Optional[str] = None
    retry_count: int
    last_call_at: Optional[datetime] = None
    next_call_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeadStatusUpdate(BaseModel):
    status: LeadStatus

class KanbanColumn(BaseModel):
    status: LeadStatus
    leads: List[LeadOut]
    count: int

class KanbanBoardResponse(BaseModel):
    columns: Dict[str, KanbanColumn]
