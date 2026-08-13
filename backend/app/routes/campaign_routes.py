# routes/campaign_routes.py

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from app.database.connection import get_db
from app.controllers import auth_controller, campaign_controller
from app.models.user_model import User, UserRole
from app.models.campaign import CampaignStatus, Campaign
from app.models.wallet import Wallet
from app.schemas.campaign_schema import (
    CampaignCreate, CampaignUpdate, CampaignOut, CampaignAssignLeads,
    BlacklistAdd, BlacklistOut
)
from app.routes.lead_routes import require_payment

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
def create_campaign_endpoint(
    request_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """Create a new campaign for a paid and approved tenant workspace."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        if current_user.role == UserRole.SUPER_ADMIN:
            from app.models.tenant import Tenant
            first_tenant = db.query(Tenant).first()
            if first_tenant:
                tenant_id = first_tenant.id
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No tenant workspace available in system to create campaign for."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with any tenant workspace."
            )
    return campaign_controller.create_campaign(db, tenant_id, request_in)

@router.get("", response_model=List[CampaignOut])
def get_campaigns_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """Retrieve all campaigns for the tenant workspace (or all campaigns for Super Admin)."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        if current_user.role == UserRole.SUPER_ADMIN:
            from app.models.campaign import Campaign
            return db.query(Campaign).all()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    return campaign_controller.get_campaigns(db, tenant_id)

# -------------------------------------------------------------
# DND BLACKLIST ROUTES (Declared before /{campaign_id} route parameter)
# -------------------------------------------------------------

@router.post("/blacklist", response_model=BlacklistOut, status_code=status.HTTP_201_CREATED)
def add_to_blacklist_endpoint(
    request_in: BlacklistAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """Add a phone number to DND / opt-out blacklist repository."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    return campaign_controller.add_to_blacklist(db, tenant_id, request_in.phone, request_in.reason)

@router.get("/blacklist", response_model=List[BlacklistOut])
def get_blacklist_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """Retrieve all blacklisted phone numbers for the tenant."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    return campaign_controller.get_blacklist(db, tenant_id)

# -------------------------------------------------------------
# CAMPAIGN ID PARAMETER ROUTES
# -------------------------------------------------------------

@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign_endpoint(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_payment)
):
    """Retrieve details of a specific campaign."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    db_campaign = campaign_controller.get_campaign_by_id(db, campaign_id, tenant_id)
    if not db_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or access denied."
        )
    return db_campaign

@router.post("/{campaign_id}/leads", status_code=status.HTTP_200_OK)
def assign_leads_endpoint(
    campaign_id: UUID,
    request_in: CampaignAssignLeads,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """Link a list of leads to a campaign. Resets their calling parameters to PENDING_QUEUE."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    db_campaign = campaign_controller.get_campaign_by_id(db, campaign_id, tenant_id)
    if not db_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or access denied."
        )
        
    leads = campaign_controller.assign_leads_to_campaign(db, campaign_id, request_in.lead_ids, tenant_id)
    return {
        "status": "success",
        "message": f"Successfully linked {len(leads)} leads to campaign '{db_campaign.name}'."
    }

@router.post("/{campaign_id}/launch", response_model=CampaignOut)
def launch_campaign_endpoint(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """
    Launch campaign dialer.
    1. Checks if wallet balance > 0. If <= 0, immediately suspends campaign.
    2. If balance > 0, activates campaign and triggers background queue worker dials.
    """
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    db_campaign = campaign_controller.get_campaign_by_id(db, campaign_id, tenant_id)
    if not db_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or access denied."
        )

    # Check Wallet balance
    wallet = db.query(Wallet).filter(Wallet.tenant_id == tenant_id).first()
    if not wallet or wallet.balance <= 0:
        db_campaign.status = CampaignStatus.SUSPENDED
        db.commit()
        db.refresh(db_campaign)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign suspended: Insufficient wallet balance. Please recharge."
        )

    # Activate Campaign
    db_campaign.status = CampaignStatus.ACTIVE
    db.commit()
    db.refresh(db_campaign)

    # Trigger async background task for dialing
    engine = db.get_bind()
    db_session_factory = sessionmaker(bind=engine)
    background_tasks.add_task(
        campaign_controller.process_campaign_dialing,
        db_session_factory,
        tenant_id,
        campaign_id
    )

    return db_campaign

@router.post("/{campaign_id}/suspend", response_model=CampaignOut)
def suspend_campaign_endpoint(
    campaign_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.require_approved_company)
):
    """Manually pause/suspend the campaign dialer execution."""
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant workspace."
        )
    db_campaign = campaign_controller.get_campaign_by_id(db, campaign_id, tenant_id)
    if not db_campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found or access denied."
        )

    db_campaign.status = CampaignStatus.SUSPENDED
    db.commit()
    db.refresh(db_campaign)
    return db_campaign
