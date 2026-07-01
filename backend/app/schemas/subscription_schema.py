# schemas/subscription_schema.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models.subscription import SubscriptionStatus

class SelectPlanRequest(BaseModel):
    plan_id: str

class SubscriptionOut(BaseModel):
    id: UUID
    tenant_id: UUID
    plan_id: str
    status: SubscriptionStatus
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
