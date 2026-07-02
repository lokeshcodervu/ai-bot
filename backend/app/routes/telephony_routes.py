from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect, Depends, Form, HTTPException, status
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

@router.post("/call-lead/{lead_id}")
def call_single_lead(
    lead_id: UUID,
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
                record=True
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
        return {"status": "success", "message": "Simulated call started (No Twilio credentials configured in DB or .env)."}
