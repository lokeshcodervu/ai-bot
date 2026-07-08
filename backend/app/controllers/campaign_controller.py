# controllers/campaign_controller.py

from typing import List, Optional, Dict
from uuid import UUID
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import or_

from app.models.campaign import Campaign, CampaignStatus
from app.models.blacklist import BlacklistedNumber
from app.models.lead import Lead, LeadStatus
from app.models.wallet import Wallet
from app.schemas.campaign_schema import CampaignCreate, CampaignUpdate

def get_campaign_by_id(db: Session, campaign_id: UUID, tenant_id: UUID) -> Optional[Campaign]:
    """Fetch campaign by ID and tenant_id."""
    return db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id).first()

def get_campaigns(db: Session, tenant_id: UUID) -> List[Campaign]:
    """Fetch all campaigns for a tenant."""
    return db.query(Campaign).filter(Campaign.tenant_id == tenant_id).order_by(Campaign.created_at.desc()).all()

def create_campaign(db: Session, tenant_id: UUID, campaign_in: CampaignCreate) -> Campaign:
    """Create a new campaign."""
    db_campaign = Campaign(
        tenant_id=tenant_id,
        name=campaign_in.name,
        start_time=campaign_in.start_time,
        end_time=campaign_in.end_time,
        timezone=campaign_in.timezone,
        max_concurrency=campaign_in.max_concurrency,
        retry_delay_minutes=campaign_in.retry_delay_minutes,
        max_retries=campaign_in.max_retries,
        status=CampaignStatus.DRAFT
    )
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def update_campaign(db: Session, db_campaign: Campaign, campaign_in: CampaignUpdate) -> Campaign:
    """Update campaign configurations."""
    update_data = campaign_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def assign_leads_to_campaign(db: Session, campaign_id: UUID, lead_ids: List[UUID], tenant_id: UUID) -> List[Lead]:
    """Link a list of leads to a campaign and reset call parameters."""
    leads = db.query(Lead).filter(
        Lead.id.in_(lead_ids),
        Lead.tenant_id == tenant_id
    ).all()
    
    for lead in leads:
        lead.campaign_id = campaign_id
        lead.status = LeadStatus.PENDING_QUEUE
        # Reset call metrics on re-assignment
        lead.call_disposition = None
        lead.retry_count = 0
        lead.last_call_at = None
        lead.next_call_at = None
        
    db.commit()
    return leads

def add_to_blacklist(db: Session, tenant_id: UUID, phone: str, reason: str) -> BlacklistedNumber:
    """Add a phone number to the DND/Opt-out blacklist."""
    # Clean phone first
    from app.controllers.lead_controller import clean_phone_number
    cleaned_phone = clean_phone_number(phone)
    
    # Check if already blacklisted
    existing = db.query(BlacklistedNumber).filter(
        BlacklistedNumber.tenant_id == tenant_id,
        BlacklistedNumber.phone == cleaned_phone
    ).first()
    if existing:
        existing.reason = reason
        db.commit()
        db.refresh(existing)
        return existing
        
    db_blacklist = BlacklistedNumber(
        tenant_id=tenant_id,
        phone=cleaned_phone,
        reason=reason
    )
    db.add(db_blacklist)
    db.commit()
    db.refresh(db_blacklist)
    return db_blacklist

def get_blacklist(db: Session, tenant_id: UUID) -> List[BlacklistedNumber]:
    """Retrieve all blacklisted numbers for a tenant."""
    return db.query(BlacklistedNumber).filter(BlacklistedNumber.tenant_id == tenant_id).all()

def is_blacklisted(db: Session, tenant_id: UUID, phone: str) -> bool:
    """Check if a phone number is blacklisted."""
    from app.controllers.lead_controller import clean_phone_number
    cleaned_phone = clean_phone_number(phone)
    record = db.query(BlacklistedNumber).filter(
        BlacklistedNumber.tenant_id == tenant_id,
        BlacklistedNumber.phone == cleaned_phone
    ).first()
    return record is not None

def is_within_call_window(start_time_str: str, end_time_str: str, tz_name: str) -> bool:
    """Verify if current time falls within start_time and end_time inside specified timezone."""
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("Asia/Kolkata")
        
    now_tz = datetime.now(tz)
    
    # Parse HH:MM
    start_h, start_m = map(int, start_time_str.split(":"))
    end_h, end_m = map(int, end_time_str.split(":"))
    
    start_time = now_tz.replace(hour=start_h, minute=start_m, second=0, microsecond=0)
    end_time = now_tz.replace(hour=end_h, minute=end_m, second=0, microsecond=0)
    
    return start_time <= now_tz <= end_time

def process_campaign_dialing(db_session_factory, tenant_id: UUID, campaign_id: UUID):
    """
    Background worker task simulating outbound dialer queue processing:
    1. Checks if campaign status is ACTIVE.
    2. Validates tenant's wallet balance (immediately suspends campaign if balance <= 0).
    3. Verifies calling time window.
    4. Gathers pending leads (status is Pending Queue or Ready To Call).
    5. Filters leads through local DND blacklist (marks them as DND Skip).
    6. Simulates Twilio dials and updates statuses/retry schedulers.
    """
    print(f"[DIALER WORKER] Starting dialing queue for campaign={campaign_id}, tenant={tenant_id}")
    db = db_session_factory()
    
    try:
        # 1. Fetch Campaign
        campaign = db.query(Campaign).filter(
            Campaign.id == campaign_id,
            Campaign.tenant_id == tenant_id
        ).first()
        
        if not campaign or campaign.status != CampaignStatus.ACTIVE:
            print(f"[DIALER WORKER] Early exit: Campaign {campaign_id} is not Active.")
            return

        # Fetch Tenant info for Twilio keys
        from app.models.tenant import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()

        # 2. Check Wallet balance
        wallet = db.query(Wallet).filter(Wallet.tenant_id == tenant_id).first()
        if not wallet or wallet.balance <= 0:
            print(f"[DIALER WORKER] Suspending campaign due to insufficient wallet balance: {wallet.balance if wallet else 0}")
            campaign.status = CampaignStatus.SUSPENDED
            db.commit()
            return

        # 3. Check time calling window rules
        if not is_within_call_window(campaign.start_time, campaign.end_time, campaign.timezone):
            print(f"[DIALER WORKER] Calling window closed for timezone {campaign.timezone} ({campaign.start_time} - {campaign.end_time}). Updating leads to 'Ready To Call'.")
            # Mark leads currently in 'Pending Queue' as 'Ready To Call'
            db.query(Lead).filter(
                Lead.campaign_id == campaign_id,
                Lead.status == LeadStatus.PENDING_QUEUE
            ).update({"status": LeadStatus.READY_TO_CALL})
            db.commit()
            return

        # 4. Fetch leads that are pending a call
        now_utc = datetime.now(timezone.utc)
        leads = db.query(Lead).filter(
            Lead.campaign_id == campaign_id,
            Lead.tenant_id == tenant_id,
            or_(
                Lead.status == LeadStatus.PENDING_QUEUE,
                Lead.status == LeadStatus.READY_TO_CALL
            ),
            or_(
                Lead.next_call_at == None,
                Lead.next_call_at <= now_utc
            )
        ).limit(50).all() # Process in batches of 50

        if not leads:
            # Check if there are any future retries scheduled
            remaining_future_leads = db.query(Lead).filter(
                Lead.campaign_id == campaign_id,
                Lead.tenant_id == tenant_id,
                or_(
                    Lead.status == LeadStatus.PENDING_QUEUE,
                    Lead.status == LeadStatus.READY_TO_CALL
                )
            ).count()
            
            if remaining_future_leads == 0:
                print(f"[DIALER WORKER] Campaign {campaign_id} completed successfully. No leads remaining.")
                campaign.status = CampaignStatus.COMPLETED
                db.commit()
            else:
                print(f"[DIALER WORKER] No leads ready for retry yet. Leads awaiting future retry: {remaining_future_leads}")
            return

        # 5. Process calls up to concurrency limit
        active_dial_limit = min(campaign.max_concurrency, len(leads))
        leads_to_dial = leads[:active_dial_limit]

        # Fetch blacklist to skip query lookups in loop
        blacklist_set = {
            row[0] for row in db.query(BlacklistedNumber.phone).filter(
                BlacklistedNumber.tenant_id == tenant_id
            ).all()
        }

        # Mock results list
        # We simulate: 50% Answered, 25% Busy, 25% No Answer
        import random
        outcomes_pool = ["Answered", "Answered", "Busy", "No Answer"]

        for lead in leads_to_dial:
            # Verify wallet before each dial
            db.refresh(wallet)
            if wallet.balance <= 0:
                print(f"[DIALER WORKER] Middle-run halt: Insufficient balance. Suspending campaign.")
                campaign.status = CampaignStatus.SUSPENDED
                db.commit()
                return

            # DND Pre-dial check
            from app.controllers.lead_controller import clean_phone_number
            cleaned_phone = clean_phone_number(lead.phone)
            
            if cleaned_phone in blacklist_set:
                print(f"[DIALER WORKER] DND hit! Skipping lead {lead.id} with phone {cleaned_phone}")
                lead.status = LeadStatus.NOT_INTERESTED
                lead.call_disposition = "DND Skip"
                lead.last_call_at = datetime.now(timezone.utc)
                db.commit()
                continue

            # Check if tenant has real Twilio credentials configured
            import os
            use_real_twilio = False
            if tenant and tenant.twilio_account_sid and tenant.twilio_auth_token and tenant.twilio_phone_number:
                use_real_twilio = True
                
            if use_real_twilio:
                try:
                    from twilio.rest import Client
                    twilio_client = Client(tenant.twilio_account_sid, tenant.twilio_auth_token)
                    
                    # Read Ngrok public tunnel base URL or fallback to localhost
                    callback_base = os.getenv("PUBLIC_CALLBACK_URL", "http://localhost:8000")
                    twiml_url = f"{callback_base}/api/v1/telephony/outbound-twiml?campaign_id={campaign_id}&lead_id={lead.id}"
                    
                    print(f"[DIALER WORKER] Placing real Twilio call to {lead.phone} from {tenant.twilio_phone_number}...")
                    call = twilio_client.calls.create(
                        to=lead.phone,
                        from_=tenant.twilio_phone_number,
                        url=twiml_url,
                        record=True,
                        status_callback=f"{callback_base}/api/v1/telephony/status-callback?lead_id={lead.id}&campaign_id={campaign_id}",
                        status_callback_event=["completed", "busy", "no-answer", "failed", "canceled"],
                        status_callback_method="POST"
                    )
                    print(f"[DIALER WORKER] Twilio call initiated successfully. Call SID: {call.sid}")
                    
                    lead.status = LeadStatus.CONNECTED
                    lead.last_call_at = datetime.now(timezone.utc)
                    db.commit()
                    
                    # Publish Connected status
                    from app.utils.pubsub import publish_sync
                    publish_sync(f"campaign:{campaign_id}", {
                        "event": "status_update",
                        "lead_id": str(lead.id),
                        "status": "Connected"
                    })
                    continue  # In real telephony, Twilio Webhook callback executes voice orchestrator asynchronously
                except Exception as twilio_err:
                    print(f"[DIALER WORKER WARNING] Twilio call initiation failed: {str(twilio_err)}. Falling back to simulation.")
                    
            # Simulate Outbound Call Connect
            print(f"[DIALER WORKER] Connecting dial for lead={lead.id} ({lead.name}) via simulated webhook...")
            lead.status = LeadStatus.CONNECTED
            db.commit()
            
            # Publish Connected event
            from app.utils.pubsub import publish_sync
            publish_sync(f"campaign:{campaign_id}", {
                "event": "status_update",
                "lead_id": str(lead.id),
                "status": "Connected"
            })
            
            # Select simulated outcome
            outcome = random.choice(outcomes_pool)
            lead.last_call_at = datetime.now(timezone.utc)

            # Check outcome transitions
            if outcome == "Answered":
                # Stream conversational dialogue turns
                import time
                dialogue_turns = [
                    {"speaker": "AI", "text": "Hello, this is Neha from Q3 Real Estate. Am I speaking with the property owner?"},
                    {"speaker": "User", "text": "Yes, I am the owner. How can I help you?"},
                    {"speaker": "AI", "text": "We noticed you listed a 3BHK villa in Sector 62. Is it still available for rent?"},
                    {"speaker": "User", "text": "Yes, it is still available. The monthly rent is 45,000 rupees."},
                    {"speaker": "AI", "text": "Great! We have some prospective tenants who are looking to move in next month. Can we schedule a site visit for this Saturday?"},
                    {"speaker": "User", "text": "Sure, Saturday at 4 PM works for me."},
                    {"speaker": "AI", "text": "Perfect! I have scheduled the visit for Saturday at 4 PM. We will share the details via WhatsApp. Thank you and have a great day!"}
                ]
                
                for turn in dialogue_turns:
                    publish_sync(f"campaign:{campaign_id}:lead:{lead.id}", turn)
                    time.sleep(0.8) # Delay to simulate conversational speech

                lead.status = LeadStatus.CONVERTED
                lead.call_disposition = "Answered"
                print(f"[DIALER WORKER] Call Connected. Outcome: Answered (Converted) for lead {lead.id}.")
                
                # Save CallLog
                from app.models.call_log import CallLog
                db_call_log = CallLog(
                    tenant_id=tenant_id,
                    lead_id=lead.id,
                    campaign_id=campaign_id,
                    call_duration=random.randint(45, 115),
                    call_disposition="Answered",
                    recording_url=f"https://s3.amazonaws.com/ai-bot-recordings/rec_{uuid.uuid4().hex[:12]}.mp3",
                    ai_summary="Property owner confirmed listing availability of 3BHK Sector 62 villa for rent at 45,000 INR. Scheduled site visit for Saturday at 4 PM.",
                    intent_tag="Warm Lead",
                    transcript=dialogue_turns
                )
                db.add(db_call_log)
                db.commit()

                # Publish Final Completed Converted status
                publish_sync(f"campaign:{campaign_id}", {
                    "event": "status_update",
                    "lead_id": str(lead.id),
                    "status": "Converted",
                    "disposition": "Answered"
                })
            else:
                # Outcome is Busy or No Answer
                lead.call_disposition = outcome
                
                # Apply retry rules
                if lead.retry_count < campaign.max_retries:
                    lead.retry_count += 1
                    lead.status = LeadStatus.PENDING_QUEUE
                    # Schedule retry
                    retry_time = datetime.now(timezone.utc) + timedelta(minutes=campaign.retry_delay_minutes)
                    lead.next_call_at = retry_time
                    print(f"[DIALER WORKER] Outcome: {outcome}. Scheduling retry #{lead.retry_count} at {retry_time} for lead {lead.id}.")
                else:
                    lead.status = LeadStatus.NOT_INTERESTED
                    print(f"[DIALER WORKER] Outcome: {outcome}. Maximum retries ({campaign.max_retries}) reached. Rejecting lead {lead.id}.")
                    
                # Save CallLog for failed/busy outcome
                from app.models.call_log import CallLog
                db_call_log = CallLog(
                    tenant_id=tenant_id,
                    lead_id=lead.id,
                    campaign_id=campaign_id,
                    call_duration=0,
                    call_disposition=outcome,
                    recording_url=None,
                    ai_summary=None,
                    intent_tag=None,
                    transcript=None
                )
                db.add(db_call_log)
                db.commit()

                # Publish Final completed status with disposition
                publish_sync(f"campaign:{campaign_id}", {
                    "event": "status_update",
                    "lead_id": str(lead.id),
                    "status": lead.status,
                    "disposition": outcome
                })
            
        print(f"[DIALER WORKER] Finished processing dialing batch.")

    except Exception as e:
        db.rollback()
        print(f"[DIALER WORKER ERROR] Exception in background dialer: {str(e)}")
    finally:
        db.close()
