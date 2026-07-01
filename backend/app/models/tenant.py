# models/tenant.py

import uuid
import enum
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Text,
    Integer,
    Enum,
    BigInteger,
    JSON,
    Numeric,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AIProvider(str, enum.Enum):
    OPENAI = "OPENAI"
    ANTHROPIC = "ANTHROPIC"

class VoiceProvider(str, enum.Enum):
    ELEVENLABS = "ELEVENLABS"
    PLAYHT = "PLAYHT"

class STTProvider(str, enum.Enum):
    DEEPGRAM = "DEEPGRAM"
    WHISPER = "WHISPER"

class Tenant(Base):
    __tablename__ = "tenants"

    __table_args__ = (
        Index("idx_tenant_active", "is_active"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # COMPANY DETAILS
    company_name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    company_email = Column(String(255), unique=True, nullable=False, index=True)
    company_phone = Column(String(20), unique=True, nullable=True, index=True)
    website = Column(String(255))
    logo = Column(Text)
    address = Column(Text)
    timezone = Column(String(100), default="Asia/Kolkata")
    industry = Column(String(100), index=True)

    # AI CONFIGURATION
    ai_provider = Column(Enum(AIProvider), default=AIProvider.OPENAI)
    ai_model = Column(String(100), default="gpt-4o")
    ai_temperature = Column(Numeric(2, 1), default=0.7)
    voice_provider = Column(Enum(VoiceProvider), default=VoiceProvider.ELEVENLABS)
    voice_id = Column(String(255))
    voice_speed = Column(Numeric(2, 1), default=1.0)
    stt_provider = Column(Enum(STTProvider), default=STTProvider.DEEPGRAM)
    system_prompt = Column(Text)
    system_prompt_version = Column(Integer, default=1, nullable=False)
    has_knowledge_base = Column(Boolean, default=False, nullable=False)
    is_ai_ready = Column(Boolean, default=False, nullable=False)

    # KNOWLEDGE BASE
    pinecone_namespace = Column(String(255), unique=True, index=True)

    # TELEPHONY
    twilio_account_sid = Column(String(255))
    twilio_auth_token = Column(String(255))
    twilio_phone_number = Column(String(30))
    twilio_max_calls_per_second = Column(Integer, default=2, nullable=False)

    # SECURITY & COMPLIANCE
    api_key = Column(String(255), unique=True, index=True)
    webhook_secret = Column(String(255))
    require_recording_consent = Column(Boolean, default=True, nullable=False)
    recording_consent_text = Column(Text, default="This call is recorded for quality and training purposes. Do you consent?", nullable=True)

    # STATUS FLAGS
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_payment_done = Column(Boolean, default=False)
    is_onboarding_completed = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    settings = Column(JSON, default=dict)
    notes = Column(Text)

    # TIMESTAMPS
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
    last_activity_at = Column(DateTime(timezone=True))

    # RELATIONSHIPS
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan", lazy="selectin")
    subscription = relationship("Subscription", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="tenant", cascade="all, delete-orphan")
    usage = relationship("TenantUsage", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    wallet = relationship("Wallet", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="tenant", cascade="all, delete-orphan")
    embedding_logs = relationship("EmbeddingLog", back_populates="tenant", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="tenant", cascade="all, delete-orphan")
    campaigns = relationship("Campaign", back_populates="tenant", cascade="all, delete-orphan")
    blacklisted_numbers = relationship("BlacklistedNumber", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant {self.company_name}>"
