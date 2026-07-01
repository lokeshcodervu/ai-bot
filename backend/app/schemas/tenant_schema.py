# schemas/tenant_schema.py

from pydantic import BaseModel, ConfigDict, EmailStr, HttpUrl, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, Dict, Any
from app.models.tenant import AIProvider, VoiceProvider, STTProvider

class TenantBase(BaseModel):
    company_name: str
    slug: str
    company_email: EmailStr
    company_phone: Optional[str] = None
    website: Optional[str] = None
    timezone: Optional[str] = "Asia/Kolkata"
    industry: Optional[str] = None

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    company_name: Optional[str] = None
    company_phone: Optional[str] = None
    website: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    timezone: Optional[str] = None
    industry: Optional[str] = None
    
    # AI Config
    ai_provider: Optional[AIProvider] = None
    ai_model: Optional[str] = None
    ai_temperature: Optional[float] = Field(
        default=0.7,
        ge=0.0,
        le=2.0
    )
    voice_provider: Optional[VoiceProvider] = None
    voice_id: Optional[str] = None
    voice_speed: Optional[float] = Field(
        default=1.0,
        ge=0.5,
        le=2.0
    )
    stt_provider: Optional[STTProvider] = None
    system_prompt: Optional[str] = None
    
    # Telephony settings
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # Compliance config
    require_recording_consent: Optional[bool] = None
    recording_consent_text: Optional[str] = None
    
    settings: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    
    last_activity_at: Optional[datetime] = None

class TenantOut(TenantBase):
    id: UUID
    logo: Optional[str] = None
    address: Optional[str] = None
    ai_provider: AIProvider
    ai_model: str
    ai_temperature: float
    voice_provider: VoiceProvider
    voice_id: Optional[str] = None
    voice_speed: float
    stt_provider: STTProvider
    system_prompt: Optional[str] = None
    system_prompt_version: int
    has_knowledge_base: bool
    is_ai_ready: bool
    pinecone_namespace: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    twilio_max_calls_per_second: int
    require_recording_consent: bool
    recording_consent_text: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_payment_done: bool
    is_onboarding_completed: bool
    settings: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_activity_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TenantMinimalOut(BaseModel):
    id: UUID
    company_name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)

class TenantListResponse(BaseModel):
    items: list[TenantOut]
    total: int
    page: int
    size: int

# =========================================================
# PHASE 1 SETUP SCHEMAS
# =========================================================

class VoiceOut(BaseModel):
    voice_id: str
    name: str
    gender: str
    preview_url: str

class VoiceSelectRequest(BaseModel):
    voice_id: str

class SystemPromptRequest(BaseModel):
    system_prompt: str = Field(..., min_length=10, max_length=2000)

class SystemPromptResponse(BaseModel):
    system_prompt: str
    system_prompt_version: int

class TwilioLimitsRequest(BaseModel):
    twilio_max_calls_per_second: int = Field(..., ge=1, le=10)

class VectorStatusOut(BaseModel):
    status: str  # PROCESSING / COMPLETED / FAILED

class WalletRechargeRequest(BaseModel):
    amount: int = Field(..., gt=0)  # recharge amount in cents

class WalletOut(BaseModel):
    tenant_id: UUID
    balance: int
    currency: str

    model_config = ConfigDict(from_attributes=True)
