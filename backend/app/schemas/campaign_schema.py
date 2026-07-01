# schemas/campaign_schema.py

from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List
from app.models.campaign import CampaignStatus

class CampaignBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "17:00"
    timezone: Optional[str] = "Asia/Kolkata"
    max_concurrency: Optional[int] = Field(2, ge=1, le=10)
    retry_delay_minutes: Optional[int] = Field(30, ge=1)
    max_retries: Optional[int] = Field(1, ge=0)

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = None
    max_concurrency: Optional[int] = None
    retry_delay_minutes: Optional[int] = None
    max_retries: Optional[int] = None

class CampaignOut(CampaignBase):
    id: UUID
    tenant_id: UUID
    status: CampaignStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CampaignAssignLeads(BaseModel):
    lead_ids: List[UUID] = Field(..., min_length=1)

class BlacklistAdd(BaseModel):
    phone: str = Field(..., min_length=7, max_length=50)
    reason: Optional[str] = "Opt-out"

class BlacklistOut(BaseModel):
    id: UUID
    tenant_id: UUID
    phone: str
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
