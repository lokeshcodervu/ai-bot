# routes/live_routes.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
import json
import asyncio
from typing import Optional

from app.database.connection import get_db
from app.utils.pubsub import pubsub_broker
from app.utils.helpers import decode_access_token
from app.models.user_model import User
from app.models.campaign import Campaign

router = APIRouter(tags=["Live Monitoring"])

def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """Helper to authenticate JWT token from query parameters in WebSockets."""
    try:
        payload = decode_access_token(token)
        if not payload:
            return None
        username = payload.get("sub")
        if not username:
            return None
        return db.query(User).filter(User.username == username, User.is_deleted == False).first()
    except Exception:
        return None

@router.websocket("/campaigns/{campaign_id}/ws")
async def campaign_ws_endpoint(
    websocket: WebSocket,
    campaign_id: UUID,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint streaming live updates of a running campaign.
    Channels: Status updates (e.g. Connected, Converted, Busy).
    """
    await websocket.accept()
    
    # 1. Authenticate JWT token
    user = get_user_from_token(token, db)
    if not user or not user.tenant_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token.")
        return
        
    # Check if tenant subscription has paid
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant or not tenant.is_payment_done:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Subscription payment required.")
        return
        
    # 2. Check campaign existence and isolation
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.tenant_id == user.tenant_id).first()
    if not campaign:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Campaign not found or access denied.")
        return

    # 3. Subscribe to campaign channel
    channel_name = f"campaign:{campaign_id}"
    subscription = await pubsub_broker.subscribe(channel_name)
    
    # Background reader task to detect socket disconnection
    async def client_reader():
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass

    reader_task = asyncio.create_task(client_reader())
    
    try:
        if pubsub_broker.use_redis and hasattr(subscription, "listen"):
            while not reader_task.done():
                msg = await subscription.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg and msg.get("type") == "message":
                    data = msg.get("data")
                    if isinstance(data, str):
                        data = json.loads(data)
                    await websocket.send_json(data)
                await asyncio.sleep(0.1)
        else:
            while not reader_task.done():
                try:
                    data = await asyncio.wait_for(subscription.get(), timeout=1.0)
                    await websocket.send_json(data)
                except asyncio.TimeoutError:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        await pubsub_broker.unsubscribe(channel_name, subscription)

@router.websocket("/campaigns/{campaign_id}/leads/{lead_id}/transcript/ws")
async def transcript_ws_endpoint(
    websocket: WebSocket,
    campaign_id: str,
    lead_id: UUID,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint streaming real-time conversational transcripts (Deepgram simulation).
    """
    await websocket.accept()
    
    # 1. Authenticate JWT token
    user = get_user_from_token(token, db)
    if not user or not user.tenant_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token.")
        return
        
    # Check if tenant subscription has paid
    from app.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant or not tenant.is_payment_done:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Subscription payment required.")
        return

    # 2. Check lead validity and association with campaign
    from app.models.lead import Lead
    if campaign_id == "single-call":
        lead = db.query(Lead).filter(
            Lead.id == lead_id, 
            Lead.tenant_id == user.tenant_id
        ).first()
    else:
        try:
            campaign_uuid = UUID(campaign_id)
        except ValueError:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid campaign ID format.")
            return

        lead = db.query(Lead).filter(
            Lead.id == lead_id, 
            Lead.tenant_id == user.tenant_id, 
            Lead.campaign_id == campaign_uuid
        ).first()

    if not lead:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Lead not found or access denied.")
        return

    # 3. Subscribe to transcript stream channel
    channel_name = f"campaign:{campaign_id}:lead:{lead_id}"

    subscription = await pubsub_broker.subscribe(channel_name)
    
    async def client_reader():
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass

    reader_task = asyncio.create_task(client_reader())
    
    try:
        if pubsub_broker.use_redis and hasattr(subscription, "listen"):
            while not reader_task.done():
                msg = await subscription.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if msg and msg.get("type") == "message":
                    data = msg.get("data")
                    if isinstance(data, str):
                        data = json.loads(data)
                    await websocket.send_json(data)
                await asyncio.sleep(0.1)
        else:
            while not reader_task.done():
                try:
                    data = await asyncio.wait_for(subscription.get(), timeout=1.0)
                    await websocket.send_json(data)
                except asyncio.TimeoutError:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        await pubsub_broker.unsubscribe(channel_name, subscription)
