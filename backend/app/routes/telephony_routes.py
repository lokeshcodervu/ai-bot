from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect, Depends, Form, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import sessionmaker, Session
from app.database.connection import get_db
from app.config.settings import settings
from app.controllers import voice_orchestrator, auth_controller
from app.models.user_model import User
from app.models.lead import Lead, LeadStatus
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from uuid import UUID
from twilio.rest import Client
import xml.etree.ElementTree as ET
import os
import sys

# Safe print to prevent UnicodeEncodeError on Windows consoles when logging unicode characters
_original_print = print
def safe_print(*args, **kwargs):
    new_args = []
    encoding = getattr(sys.stdout, 'encoding', 'utf-8') or 'utf-8'
    for arg in args:
        if isinstance(arg, str):
            try:
                arg.encode(encoding)
                new_args.append(arg)
            except UnicodeEncodeError:
                new_args.append(arg.encode(encoding, errors='replace').decode(encoding))
        else:
            new_args.append(arg)
    try:
        _original_print(*new_args, **kwargs)
    except Exception:
        pass

print = safe_print

router = APIRouter(prefix="/telephony", tags=["Telephony"])

@router.post("/outbound-twiml")
def outbound_twiml(campaign_id: str, lead_id: str):
    """
    Generate TwiML XML markup instructing Twilio to connect immediately to media-stream.
    """
    import os
    response_el = ET.Element("Response")
    connect_el = ET.SubElement(response_el, "Connect")
    
    callback_base = os.getenv("PUBLIC_CALLBACK_URL", "http://localhost:8000")
    ws_base = callback_base.replace("https://", "wss://").replace("http://", "ws://")
    stream_url = f"{ws_base}/api/v1/telephony/media-stream"
    
    stream_el = ET.SubElement(connect_el, "Stream", url=stream_url)
    
    # Forward parameters with auto-detect language configuration
    ET.SubElement(stream_el, "Parameter", name="campaign_id", value=campaign_id)
    ET.SubElement(stream_el, "Parameter", name="lead_id", value=lead_id)
    ET.SubElement(stream_el, "Parameter", name="language", value="auto")
    
    twiml_xml = ET.tostring(response_el, encoding="utf-8", method="xml").decode("utf-8")
    
    return Response(
        content=f'<?xml version="1.0" encoding="UTF-8"?>\n{twiml_xml}',
        media_type="application/xml"
    )

# @router.post("/language-selected")
# def language_selected(campaign_id: str, lead_id: str, Digits: str = Form(...)):
#     """
#     Handle language selection callback from Twilio, connect to media-stream with language parameter.
#     """
#     import os
#     selected_lang = "hindi" if Digits == "2" else "english"
#     
#     response_el = ET.Element("Response")
#     connect_el = ET.SubElement(response_el, "Connect")
#     
#     callback_base = os.getenv("PUBLIC_CALLBACK_URL", "http://localhost:8000")
#     ws_base = callback_base.replace("https://", "wss://").replace("http://", "ws://")
#     stream_url = f"{ws_base}/api/v1/telephony/media-stream"
#     
#     stream_el = ET.SubElement(connect_el, "Stream", url=stream_url)
#     
#     # Forward parameters including selected language
#     ET.SubElement(stream_el, "Parameter", name="campaign_id", value=campaign_id)
#     ET.SubElement(stream_el, "Parameter", name="lead_id", value=lead_id)
#     ET.SubElement(stream_el, "Parameter", name="language", value=selected_lang)
#     
#     twiml_xml = ET.tostring(response_el, encoding="utf-8", method="xml").decode("utf-8")
#     
#     return Response(
#         content=f'<?xml version="1.0" encoding="UTF-8"?>\n{twiml_xml}',
#         media_type="application/xml"
#     )

@router.websocket("/media-stream")
async def media_stream_websocket(websocket: WebSocket, db_session_generator=Depends(get_db)):
    """
    WebSocket endpoint handling active telephony audio packets.
    Twilio communicates via JSON frames (start, media, stop, clear).
    """
    await websocket.accept()
    print("[TELEPHONY WS] Connection accepted from Twilio.")
    
    # We pass the db session generator factory so orchestrator can create isolated sessions
    from app.database.connection import engine
    db_session_factory = sessionmaker(bind=engine)
    
    try:
        await voice_orchestrator.handle_media_stream(websocket, db_session_factory)
    except WebSocketDisconnect:
        print("[TELEPHONY WS] Twilio disconnected.")
    except Exception as e:
        print(f"[TELEPHONY WS ERROR] Exception in media stream socket: {str(e)}")

@router.post("/status-callback")
def twilio_status_callback(
    lead_id: UUID,
    campaign_id: str,
    CallStatus: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Callback from Twilio when call status changes or completes.
    Cleans up lead status if the call is finished (busy, no-answer, failed, completed).
    """
    print(f"[TWILIO CALLBACK] Lead {lead_id} call status: {CallStatus}")
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead:
        # If the call is ended/finished and the lead is still in CONNECTED status,
        # we update the status to prevent it from getting stuck.
        if lead.status == LeadStatus.CONNECTED:
            # Determine the outcome
            if CallStatus in ["busy", "no-answer", "failed", "canceled"]:
                outcome = CallStatus.title()  # Busy, No-Answer, Failed, Canceled
            else:
                outcome = "Completed"
                
            # If there was a campaign, check if we need to apply retry rules
            if campaign_id != "single-call":
                try:
                    from app.models.campaign import Campaign
                    campaign_uuid = UUID(campaign_id)
                    campaign = db.query(Campaign).filter(Campaign.id == campaign_uuid).first()
                except ValueError:
                    campaign = None
                    
                if campaign:
                    if outcome in ["Busy", "No-Answer", "Failed", "Canceled"]:
                        if lead.retry_count < campaign.max_retries:
                            lead.retry_count += 1
                            lead.status = LeadStatus.PENDING_QUEUE
                        else:
                            lead.status = LeadStatus.NOT_INTERESTED
                    else:
                        lead.status = LeadStatus.NEEDS_FOLLOW_UP
                else:
                    lead.status = LeadStatus.NEEDS_FOLLOW_UP
            else:
                lead.status = LeadStatus.NEEDS_FOLLOW_UP
                
            lead.call_disposition = outcome
            db.commit()
            
            # Publish status update
            from app.utils.pubsub import publish_sync
            pub_campaign_id = "single-call" if campaign_id == "single-call" else campaign_id
            publish_sync(f"campaign:{pub_campaign_id}", {
                "event": "status_update",
                "lead_id": str(lead_id),
                "status": lead.status,
                "disposition": outcome
            })
            print(f"[TWILIO CALLBACK] Reset lead {lead_id} status to {lead.status}")
            
    return {"status": "success"}

def simulate_single_call_dialogue(db_session_factory, lead_id: UUID, tenant_id: UUID):
    """
    Background task to simulate a single call conversation.
    It publishes dialogue turns over pubsub and then updates the lead status.
    """
    import time
    from datetime import datetime, timezone
    from app.utils.pubsub import publish_sync
    
    # Wait a second before starting the stream to let the frontend WebSocket connect
    time.sleep(1.5)
    
    db = db_session_factory()
    try:
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return
            
        dialogue_turns = [
            {"speaker": "AI", "text": "Hello, this is Neha from CoderVu Admissions. Am I speaking with the applicant?"},
            {"speaker": "User", "text": "Yes, I applied for the AI Software Engineering bootcamp."},
            {"speaker": "AI", "text": "Wonderful! I wanted to check if you have any questions regarding our curriculum or fee structure?"},
            {"speaker": "User", "text": "Yes, is there any scholarship or job guarantee program?"},
            {"speaker": "AI", "text": "Yes! We offer up to a 50% merit-based scholarship, and we have a 100% placement assistance program with our hiring partners. Shall I schedule a brief counseling call with our program director for you?"},
            {"speaker": "User", "text": "Yes, that would be great. You can schedule it for tomorrow morning."},
            {"speaker": "AI", "text": "Perfect! I have scheduled it for tomorrow at 10 AM. You will receive a confirmation email shortly. Thank you for your time!"}
        ]
        
        # Publish dialogue turns
        for turn in dialogue_turns:
            # Double check if lead is still in CONNECTED status.
            # If user ended it manually in between, we stop.
            db.refresh(lead)
            if lead.status != LeadStatus.CONNECTED:
                print(f"[SIMULATED SINGLE CALL] Call for lead {lead_id} was interrupted/ended by user. Stopping dialogue simulation.")
                break
                
            publish_sync(f"campaign:single-call:lead:{lead_id}", turn)
            time.sleep(1.5)  # Pause to simulate speaking
            
        # Complete the call
        db.refresh(lead)
        if lead.status == LeadStatus.CONNECTED:
            lead.status = LeadStatus.CONVERTED
            lead.call_disposition = "Answered"
            lead.last_call_at = datetime.now(timezone.utc)
            db.commit()
            
            # Publish final completed status to single-call
            publish_sync("campaign:single-call", {
                "event": "status_update",
                "lead_id": str(lead_id),
                "status": "Converted",
                "disposition": "Answered"
            })
            
            # Save CallLog
            from app.models.call_log import CallLog
            db_call_log = CallLog(
                tenant_id=tenant_id,
                lead_id=lead_id,
                campaign_id=None,
                call_duration=45,
                call_disposition="Answered",
                recording_url=f"https://s3.amazonaws.com/ai-bot-recordings/rec_single_{lead_id}.mp3",
                ai_summary="Bootcamp applicant confirmed details and scheduled counseling call for tomorrow morning.",
                intent_tag="Warm Lead",
                transcript=dialogue_turns
            )
            db.add(db_call_log)
            db.commit()
            print(f"[SIMULATED SINGLE CALL] Call completed and logged successfully for lead {lead_id}.")
            
    except Exception as e:
        db.rollback()
        print(f"[SIMULATED SINGLE CALL ERROR] Exception in dialogue simulation: {str(e)}")
    finally:
        db.close()

@router.post("/call-lead/{lead_id}")
def call_single_lead(
    lead_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_controller.get_current_user)
):
    """
    Trigger an outbound call to a single lead immediately.
    """
    # 1. Fetch Lead
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == current_user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    # 2. Fetch Tenant Twilio config
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant workspace not found.")

    # 3. Check Wallet
    wallet = db.query(Wallet).filter(Wallet.tenant_id == current_user.tenant_id).first()
    if not wallet or wallet.balance <= 0:
        raise HTTPException(status_code=402, detail="Insufficient wallet balance to place calls.")

    use_real_twilio = False

    # Resolve Twilio credentials: per-tenant DB takes priority, then fall back to global .env
    effective_sid   = tenant.twilio_account_sid   or settings.TWILIO_ACCOUNT_SID
    effective_token = tenant.twilio_auth_token     or settings.TWILIO_AUTH_TOKEN
    effective_phone = tenant.twilio_phone_number   or settings.TWILIO_PHONE_NUMBER

    if effective_sid and effective_token and effective_phone:
        use_real_twilio = True
        cred_source = "per-tenant DB" if tenant.twilio_account_sid else ".env global config"
        print(f"[SINGLE DIAL] Using Twilio credentials from: {cred_source}")

    if use_real_twilio:
        try:
            twilio_client = Client(effective_sid, effective_token)
            callback_base = os.getenv("PUBLIC_CALLBACK_URL", "http://localhost:8000")
            campaign_id_str = str(lead.campaign_id) if lead.campaign_id else "single-call"
            twiml_url = f"{callback_base}/api/v1/telephony/outbound-twiml?campaign_id={campaign_id_str}&lead_id={lead.id}"

            print(f"[SINGLE DIAL] Calling {lead.phone} from {effective_phone}...")
            call = twilio_client.calls.create(
                to=lead.phone,
                from_=effective_phone,
                url=twiml_url,
                record=True,
                status_callback=f"{callback_base}/api/v1/telephony/status-callback?lead_id={lead.id}&campaign_id={campaign_id_str}",
                status_callback_event=["initiated", "ringing", "answered", "completed"],
                status_callback_method="POST"
            )
            lead.status = LeadStatus.CONNECTED
            db.commit()
            return {"status": "success", "message": f"Real call initiated. SID: {call.sid}"}
        except Exception as twilio_err:
            raise HTTPException(status_code=500, detail=f"Twilio error: {str(twilio_err)}")
    else:
        # Simulate Call — no Twilio credentials found anywhere
        lead.status = LeadStatus.CONNECTED
        db.commit()
        
        # Trigger simulated conversation in background task so the Live UI works
        from app.database.connection import engine
        db_session_factory = sessionmaker(bind=engine)
        background_tasks.add_task(
            simulate_single_call_dialogue,
            db_session_factory,
            lead.id,
            current_user.tenant_id
        )
        
        return {"status": "success", "message": "Simulated call started (No Twilio credentials configured in DB or .env)."}
