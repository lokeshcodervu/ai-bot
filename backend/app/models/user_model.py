# models/user_model.py

import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    BUSINESS_OWNER = "BUSINESS_OWNER"
    CAMPAIGN_MANAGER = "CAMPAIGN_MANAGER"
    SALES_REP = "SALES_REP"


class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_role", "role"),
        Index("idx_user_tenant", "tenant_id"),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True  # Nullable so Super Admins don't have to belong to a specific tenant
    )

    username = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String(255),
        nullable=False
    )

    full_name = Column(
        String(255),
        nullable=True
    )

    phone_number = Column(
        String(30),
        nullable=True
    )

    role = Column(
        Enum(UserRole),
        default=UserRole.SALES_REP,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=False,
        server_default="false"
    )

    is_2fa_enabled = Column(
        Boolean,
        default=False,
        server_default="false"
    )

    api_key = Column(
        String(255),
        unique=True,
        nullable=True
    )

    notes = Column(Text)

    # PASSWORD TRACKING
    password_changed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    reset_token = Column(
        String(255),
        nullable=True,
        index=True
    )

    reset_token_expires_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # SOFT DELETE
    is_deleted = Column(
        Boolean,
        default=False,
        server_default="false"
    )

    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # TIMESTAMPS
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # RELATIONSHIPS
    tenant = relationship(
        "Tenant",
        back_populates="users",
        foreign_keys=[tenant_id],
        lazy="selectin"
    )

    def __repr__(self):
        return f"<User {self.email}>"


class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    token = Column(
        String(500),
        unique=True,
        index=True,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    def __repr__(self):
        return f"<BlacklistedToken {self.token[:20]}...>"
