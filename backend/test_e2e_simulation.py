# test_e2e_simulation.py

import os
import sys
import uuid
import time
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Pretend we are running under pytest to bypass auto-DB-seeding in main.py
if "pytest" not in sys.modules:
    sys.modules["pytest"] = sys

# Override env variables to disable postgres and enforce sqlite
os.environ["DB_HOST"] = ""
os.environ["DATABASE_URL"] = "sqlite:///./test_simulation.db"

# Import app components
from app.main import app
from app.database.connection import get_db, Base
from app.models import User, Tenant, Subscription, Payment, Plan, OTPVerification, Wallet, Lead, CallLog

# Override DB Connection for script execution
TEST_DB_URL = "sqlite:///./test_simulation.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Override settings keys to enforce immediate local mock fallback
from app.config.settings import settings
settings.PINECONE_API_KEY = None
settings.OPENAI_API_KEY = None
settings.GEMINI_API_KEY = None

# Global print override to automatically flush stdout (prevent buffering in task logs)
_original_print = print
def print(*args, **kwargs):
    _original_print(*args, **kwargs)
    sys.stdout.flush()

app.dependency_overrides[get_db] = override_get_db

def run_simulation():
    print("\n" + "="*60)
    print("      AI-BOT SIMULATED TELEPHONY PIPELINE DEMO")
    print("="*60)
    
    # 1. Database Setup
    print("\n[1/7] Setting up Database Tables...")
    if os.path.exists("./test_simulation.db"):
        try:
            os.remove("./test_simulation.db")
        except Exception:
            pass
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    # Seed default plans locally to avoid connection object mismatch
    from app.models.plan import Plan
    plans_data = [
        {
            "id": "basic",
            "name": "Basic",
            "price": 29.0,
            "billing_cycle": "monthly",
            "features": {"list": ["Up to 5 team users"]},
            "max_users": 5,
            "max_campaigns": 10,
            "max_monthly_calls": 1000
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 79.0,
            "billing_cycle": "monthly",
            "features": {"list": ["Unlimited active campaigns"]},
            "max_users": 15,
            "max_campaigns": 999999,
            "max_monthly_calls": 5000
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "price": 249.0,
            "billing_cycle": "monthly",
            "features": {"list": ["Unlimited team users"]},
            "max_users": 999999,
            "max_campaigns": 999999,
            "max_monthly_calls": 999999
        }
    ]
    for plan_info in plans_data:
        existing = db.query(Plan).filter(Plan.id == plan_info["id"]).first()
        if not existing:
            db_plan = Plan(
                id=plan_info["id"],
                name=plan_info["name"],
                price=plan_info["price"],
                billing_cycle=plan_info["billing_cycle"],
                features=plan_info["features"],
                max_users=plan_info["max_users"],
                max_campaigns=plan_info["max_campaigns"],
                max_monthly_calls=plan_info["max_monthly_calls"]
            )
            db.add(db_plan)
    db.commit()
    db.close()
    
    client = TestClient(app)
    
    # 2. Onboarding Lifecycle
    print("\n[2/7] Running User Signup & OTP Verification...")
    signup_res = client.post("/api/v1/onboarding/signup", json={
        "email": "demo_owner@example.com",
        "password": "demosecurepassword123"
    })
    if signup_res.status_code != 201:
        print("ERROR SIGNUP RESPONSE:", signup_res.status_code, signup_res.json())
        sys.exit(1)
    signup_token = signup_res.json()["signup_token"]
    
    verify_res = client.post("/api/v1/onboarding/verify-otp", json={
        "signup_token": signup_token,
        "otp": "0000"
    })
    verified_token = verify_res.json()["verified_token"]
    
    print("      Selecting Industry: Real Estate...")
    ind_res = client.post("/api/v1/onboarding/select-industry", json={
        "verified_token": verified_token,
        "industry": "Real Estate"
    })
    access_token = ind_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("      Selecting Plan: Pro...")
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers)
    
    print("      Processing Payment Order...")
    pay_order = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers)
    payment_id = pay_order.json()["payment_id"]
    
    client.post("/api/v1/onboarding/verify-payment", json={
        "payment_id": payment_id,
        "gateway_payment_id": "pay_demo_123",
        "gateway_signature": "sig_demo_123"
    }, headers=headers)
    print("      Payment Successful! Workspace Activated.")
    
    # 3. Configure AI voice settings
    print("\n[3/7] Setting up Voice settings & Knowledge Base...")
    client.post("/api/v1/tenant/select-voice", json={"voice_id": "AZnzlk1XvdvUeBnXmlld"}, headers=headers)
    
    # Upload mock files
    files = [
        ("files", ("brochure.pdf", b"Mock real estate listing brochure content Sector 62 villa.", "application/pdf"))
    ]
    client.post("/api/v1/tenant/upload-kb", files=files, headers=headers)
    
    # Wait for vector status
    for _ in range(10):
        status_res = client.get("/api/v1/tenant/vector-status", headers=headers)
        if status_res.json()["status"] == "COMPLETED":
            break
        time.sleep(0.5)
        
    client.post("/api/v1/tenant/system-prompt", json={
        "system_prompt": "You are a professional real estate sales assistant."
    }, headers=headers)
    print("      AI Settings Saved. Agent Status: AI Ready Badge Activated!")
    
    # 4. Import leads
    print("\n[4/7] Importing Leads for Calling...")
    import_res = client.post("/api/v1/leads/import", json={
        "leads": [
            {"name": "Rohan Dixit", "phone": "+919876543210", "email": "rohan@example.com", "notes": "Wants Sector 62 villa"}
        ]
    }, headers=headers)
    lead_id = import_res.json()["imported_leads"][0]
    print(f"      Imported Lead: Rohan Dixit (ID: {lead_id})")
    
    # 5. Create and Configure Campaign
    print("\n[5/7] Creating Campaign & Scheduling Calling Rules...")
    campaign_res = client.post("/api/v1/campaigns", json={
        "name": "Outbound Sales Campaign",
        "start_time": "00:00",
        "end_time": "23:59",
        "timezone": "Asia/Kolkata",
        "max_concurrency": 1,
        "retry_delay_minutes": 1,
        "max_retries": 1
    }, headers=headers)
    campaign_id = campaign_res.json()["id"]
    
    client.post(f"/api/v1/campaigns/{campaign_id}/leads", json={"lead_ids": [lead_id]}, headers=headers)
    
    # Add wallet balance
    db = SessionLocal()
    from app.utils.helpers import decode_access_token
    payload = decode_access_token(access_token)
    tenant_id_str = payload["tenant_id"]
    wallet = db.query(Wallet).filter(Wallet.tenant_id == uuid.UUID(tenant_id_str)).first()
    wallet.balance = 500  # $5.00
    db.commit()
    db.close()
    print("      Wallet pre-funded: $5.00. Ready to dial!")

    # 6. Launch & Stream Call WebSockets
    print("\n[6/7] Launching Campaign & Streaming WebSockets...")
    print("-" * 50)
    
    # Connect to status WebSockets to capture dial updates
    with client.websocket_connect(f"/api/v1/campaigns/{campaign_id}/ws?token={access_token}") as ws:
        with client.websocket_connect(f"/api/v1/campaigns/{campaign_id}/leads/{lead_id}/transcript/ws?token={access_token}") as ws_trans:
            # Launch campaign: triggers BackgroundTask synchronously
            client.post(f"/api/v1/campaigns/{campaign_id}/launch", headers=headers)
            
            # Capture status updates
            frame1 = ws.receive_json()
            print(f"      [EVENT UPDATE]: Lead ID: {frame1['lead_id']} status is now: {frame1['status']}")
            
            # If call is connected, read simulated dialogue turns
            if frame1["status"] == "Connected":
                print("\n      --- LIVE CONVERSATION STREAM ---")
                for _ in range(7):
                    turn = ws_trans.receive_json()
                    print(f"      {turn['speaker']}: {turn['text']}")
                    time.sleep(0.1)
                print("      --------------------------------\n")
                
            frame2 = ws.receive_json()
            print(f"      [EVENT UPDATE]: Lead ID: {frame2['lead_id']} call finished. Disposition: {frame2['disposition']}. Lead Status: {frame2['status']}")
    print("-" * 50)
    
    # 7. Check call logs and Analytics Dashboard
    print("\n[7/7] Verifying Saved Call Logs & Dynamic Dashboard Metrics...")
    
    # Get call logs
    logs_res = client.get("/api/v1/call-logs", headers=headers)
    call_log = logs_res.json()[0]
    print(f"\n      --- SAVED DATABASE CALL LOG ---")
    print(f"      Duration  : {call_log['call_duration']} seconds")
    print(f"      Outcome   : {call_log['call_disposition']}")
    print(f"      AI Summary: {call_log['ai_summary']}")
    print(f"      Intent Tag: {call_log['intent_tag']}")
    print(f"      Audio URL : {call_log['recording_url']}")
    print(f"      --------------------------------")
    
    # Get dashboard
    dash_res = client.get("/api/v1/dashboard", headers=headers)
    dash = dash_res.json()["tenant"]["industry_data"]
    print(f"\n      --- AGGREGATED ANALYTICS DASHBOARD ---")
    print(f"      Total Leads     : {dash['leads_count']}")
    print(f"      Total Calls Made: {dash['total_calls']}")
    print(f"      Connection Rate : {dash['connection_rate']}")
    print(f"      --------------------------------")
    
    # Cleanup DB
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_simulation.db"):
        try:
            os.remove("./test_simulation.db")
        except Exception:
            pass
            
    print("\n" + "="*60)
    print("               DEMO COMPLETED SUCCESSFULLY!")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_simulation()
