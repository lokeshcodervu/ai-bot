# tests/test_api.py

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import UUID

from app.main import app
from app.database.connection import get_db, Base
from app.models import User, Tenant, Subscription, Payment, Plan, OTPVerification, SubscriptionStatus, PaymentStatus, Lead, LeadStatus, Campaign, CampaignStatus, BlacklistedNumber, Wallet, BlacklistedToken

TEST_DATABASE_URL = "sqlite:///./test_redesigned.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_test_plans(db):
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

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_test_plans(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_redesigned.db"):
        try:
            os.remove("./test_redesigned.db")
        except Exception:
            pass

@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "Backend is running" in response.json()["message"]

def test_onboarding_lifecycle(client):
    # =========================================================
    # 1. USER SIGNUP (email + password only)
    # =========================================================
    signup_data = {
        "email": "saasowner@example.com",
        "password": "supersecurepassword123"
    }
    response = client.post("/api/v1/onboarding/signup", json=signup_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["status"] == "success"
    assert "otp" in res_json["message"].lower()
    
    signup_token = res_json["signup_token"]
    user_out = res_json["user"]
    # Check auto-generated username from email prefix
    assert user_out["username"] == "saasowner"
    assert user_out["email"] == "saasowner@example.com"
    
    # Confirm user NOT created in DB yet
    db = TestingSessionLocal()
    assert db.query(User).filter(User.email == "saasowner@example.com").first() is None
    
    # Confirm OTP record is created in otp_verifications table
    otp_record = db.query(OTPVerification).filter(OTPVerification.email == "saasowner@example.com").first()
    assert otp_record is not None
    assert otp_record.otp_code == "0000"
    db.close()

    # =========================================================
    # 2. VERIFY OTP
    # =========================================================
    verify_data = {
        "signup_token": signup_token,
        "otp": "0000"
    }
    response = client.post("/api/v1/onboarding/verify-otp", json=verify_data)
    assert response.status_code == 200
    verify_json = response.json()
    assert "verified successfully" in verify_json["message"].lower()
    verified_token = verify_json["verified_token"]

    # =========================================================
    # 3. SELECT INDUSTRY (Creates Tenant and User in DB)
    # =========================================================
    industry_data = {
        "verified_token": verified_token,
        "industry": "Real Estate"
    }
    response = client.post("/api/v1/onboarding/select-industry", json=industry_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"
    
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Check that User and Tenant now exist in DB
    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.email == "saasowner@example.com").first()
    assert db_user is not None
    assert db_user.tenant_id is not None
    
    db_tenant = db.query(Tenant).filter(Tenant.id == db_user.tenant_id).first()
    assert db_tenant is not None
    assert db_tenant.industry == "Real Estate"
    # Verify baseline prompt mapped
    assert "real estate sales assistant" in db_tenant.system_prompt.lower()
    assert db_tenant.is_payment_done is False
    assert db_tenant.is_active is False
    
    # Verify Wallet and TenantUsage are initialized
    assert db_tenant.wallet is not None
    assert db_tenant.wallet.balance == 0
    assert db_tenant.wallet.currency == "USD"
    assert db_tenant.usage is not None
    assert db_tenant.usage.total_calls == 0
    db.close()

    # =========================================================
    # 3a. ACCESS DASHBOARD BEFORE PAYMENT (GATED)
    # =========================================================
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 402
    assert "payment required" in response.json()["detail"].lower()

    # =========================================================
    # 4. SELECT PLAN (Creates Subscription with INACTIVE status)
    # =========================================================
    plan_data = {
        "plan_id": "pro"
    }
    response = client.post("/api/v1/onboarding/select-plan", json=plan_data, headers=headers)
    assert response.status_code == 200
    sub_json = response.json()
    assert sub_json["plan_id"] == "pro"
    assert sub_json["status"] == "INACTIVE"
    # Plan limits are not in SubscriptionOut anymore
    assert "max_users" not in sub_json
    assert "max_campaigns" not in sub_json
    assert "max_monthly_calls" not in sub_json
    
    subscription_id = sub_json["id"]

    # =========================================================
    # 5. CREATE PAYMENT (Amount is integer cents)
    # =========================================================
    order_data = {
        "gateway": "MOCK"
    }
    response = client.post("/api/v1/onboarding/create-payment", json=order_data, headers=headers)
    assert response.status_code == 200
    order_json = response.json()
    assert order_json["amount"] == 7900 # Pro price: $79.00 -> 7900 cents
    assert isinstance(order_json["amount"], int)
    assert order_json["payment_status"] == "PENDING"
    assert order_json["gateway_order_id"] is not None
    
    payment_id = order_json["payment_id"]

    # =========================================================
    # 6. VERIFY PAYMENT (Activates Subscription and Tenant)
    # =========================================================
    verify_payment_data = {
        "payment_id": payment_id,
        "gateway_payment_id": "pay_tx_123",
        "gateway_signature": "sig_tx_123"
    }
    response = client.post("/api/v1/onboarding/verify-payment", json=verify_payment_data, headers=headers)
    assert response.status_code == 200
    pay_json = response.json()
    assert pay_json["payment_status"] == "SUCCESS"
    assert pay_json["gateway_payment_id"] == "pay_tx_123"
    assert pay_json["amount"] == 7900
    
    # Confirm DB updates
    db = TestingSessionLocal()
    db_tenant = db.query(Tenant).filter(Tenant.company_email == "saasowner@example.com").first()
    assert db_tenant.is_payment_done is True
    assert db_tenant.is_active is True
    assert db_tenant.is_onboarding_completed is True
    
    import uuid
    db_sub = db.query(Subscription).filter(Subscription.id == uuid.UUID(subscription_id)).first()
    assert db_sub.status == SubscriptionStatus.ACTIVE
    assert db_sub.start_date is not None
    assert db_sub.end_date is not None
    db.close()

    # =========================================================
    # 7. ACCESS DASHBOARD AFTER PAYMENT (SUCCESS)
    # =========================================================
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    dash_json = response.json()
    assert "welcome to the ai-bot saas dashboard" in dash_json["message"].lower()
    assert dash_json["tenant"]["plan_type"] == "PRO" # Compatible dashboard payload response mapping
    assert dash_json["tenant"]["is_payment_done"] is True
    assert dash_json["tenant"]["industry"] == "Real Estate"
    assert dash_json["tenant"]["industry_data"]["leads_count"] == 42
    assert len(dash_json["tenant"]["industry_data"]["listings"]) == 3

    # =========================================================
    # PHASE 1: BUSINESS & AI AGENT SETUP FLOW
    # =========================================================

    # 1. Update Company Profile (PUT)
    profile_data = {
        "company_name": "Updated Saasowner Corp",
        "website": "https://updatedcorp.com",
        "timezone": "America/New_York"
    }
    response = client.put("/api/v1/tenant/profile", json=profile_data, headers=headers)
    assert response.status_code == 200
    res_profile = response.json()
    assert res_profile["company_name"] == "Updated Saasowner Corp"
    assert res_profile["website"] == "https://updatedcorp.com"
    assert res_profile["timezone"] == "America/New_York"

    # 2. Get Voices (ElevenLabs list)
    response = client.get("/api/v1/tenant/voices", headers=headers)
    assert response.status_code == 200
    voices = response.json()
    assert isinstance(voices, list)
    assert len(voices) > 0
    assert "voice_id" in voices[0]
    assert "name" in voices[0]

    # 3. Select Voice
    voice_select_data = {
        "voice_id": "AZnzlk1XvdvUeBnXmlld" # Neha
    }
    response = client.post("/api/v1/tenant/select-voice", json=voice_select_data, headers=headers)
    assert response.status_code == 200
    res_voice = response.json()
    assert res_voice["voice_id"] == "AZnzlk1XvdvUeBnXmlld"
    assert res_voice["is_ai_ready"] is False # false because system prompt and knowledge base are not ready yet

    # 4. Try to Set System Prompt (SHOULD FAIL because vector status is not COMPLETED)
    prompt_data = {
        "system_prompt": "You are a professional real estate sales assistant."
    }
    response = client.post("/api/v1/tenant/system-prompt", json=prompt_data, headers=headers)
    assert response.status_code == 400
    assert "locked until knowledge base vectorization is completed" in response.json()["detail"].lower()

    # 5. Upload Knowledge Base PDFs
    files = [
        ("files", ("syllabi.pdf", b"Mock PDF text content for syllabi knowledge base.", "application/pdf")),
        ("files", ("pricing.pdf", b"Mock PDF text content for pricing knowledge base.", "application/pdf"))
    ]
    response = client.post("/api/v1/tenant/upload-kb", files=files, headers=headers)
    assert response.status_code == 200
    res_upload = response.json()
    assert res_upload["status"] == "success"
    assert len(res_upload["documents"]) == 2
    assert res_upload["documents"][0]["file_name"] == "syllabi.pdf"
    assert res_upload["documents"][1]["file_name"] == "pricing.pdf"

    # 6. Check Vector Status (Poll until COMPLETED to support async background tasks)
    import time
    for _ in range(20):
        response = client.get("/api/v1/tenant/vector-status", headers=headers)
        assert response.status_code == 200
        if response.json()["status"] == "COMPLETED":
            break
        time.sleep(0.1)
    else:
        pytest.fail("Vectorization status did not transition to COMPLETED in time.")

    # 7. Set System Prompt (SHOULD SUCCEED now that vector status is COMPLETED)
    response = client.post("/api/v1/tenant/system-prompt", json=prompt_data, headers=headers)
    assert response.status_code == 200
    res_prompt = response.json()
    assert res_prompt["system_prompt"] == "You are a professional real estate sales assistant."
    assert res_prompt["system_prompt_version"] == 2 # incremented from base version 1

    # 8. Configure Twilio limits
    twilio_data = {
        "twilio_max_calls_per_second": 5
    }
    response = client.post("/api/v1/tenant/twilio-limits", json=twilio_data, headers=headers)
    assert response.status_code == 200
    res_twilio = response.json()
    assert res_twilio["twilio_max_calls_per_second"] == 5

    # 9. Verify final Profile status (AI Ready Badge is enabled)
    response = client.get("/api/v1/tenant/profile", headers=headers)
    assert response.status_code == 200
    final_profile = response.json()
    assert final_profile["is_ai_ready"] is True
    assert final_profile["has_knowledge_base"] is True
    assert final_profile["voice_id"] == "AZnzlk1XvdvUeBnXmlld"
    assert final_profile["system_prompt"] == "You are a professional real estate sales assistant."
    assert final_profile["twilio_max_calls_per_second"] == 5


def test_insurance_onboarding_lifecycle(client):
    # =========================================================
    # 1. USER SIGNUP (email + password only)
    # =========================================================
    signup_data = {
        "email": "insuranceowner@example.com",
        "password": "securepass1234"
    }
    response = client.post("/api/v1/onboarding/signup", json=signup_data)
    assert response.status_code == 201
    res_json = response.json()
    assert res_json["status"] == "success"
    signup_token = res_json["signup_token"]
    
    # =========================================================
    # 2. VERIFY OTP
    # =========================================================
    verify_data = {
        "signup_token": signup_token,
        "otp": "0000"
    }
    response = client.post("/api/v1/onboarding/verify-otp", json=verify_data)
    assert response.status_code == 200
    verified_token = response.json()["verified_token"]
    
    # =========================================================
    # 3. SELECT INDUSTRY (Insurance)
    # =========================================================
    industry_data = {
        "verified_token": verified_token,
        "industry": "Insurance"
    }
    response = client.post("/api/v1/onboarding/select-industry", json=industry_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Confirm DB status
    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.email == "insuranceowner@example.com").first()
    assert db_user is not None
    db_tenant = db.query(Tenant).filter(Tenant.id == db_user.tenant_id).first()
    assert db_tenant is not None
    assert db_tenant.industry == "Insurance"
    assert "insurance sales assistant" in db_tenant.system_prompt.lower()
    db.close()
    
    # =========================================================
    # 4. SELECT PLAN
    # =========================================================
    plan_data = {"plan_id": "basic"}
    response = client.post("/api/v1/onboarding/select-plan", json=plan_data, headers=headers)
    assert response.status_code == 200
    
    # =========================================================
    # 5. CREATE PAYMENT
    # =========================================================
    response = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers)
    assert response.status_code == 200
    pay_json = response.json()
    payment_id = pay_json["payment_id"]
    
    # =========================================================
    # 6. VERIFY PAYMENT
    # =========================================================
    verify_payment_data = {
        "payment_id": payment_id,
        "gateway_payment_id": "pay_ins_123",
        "gateway_signature": "sig_ins_123"
    }
    response = client.post("/api/v1/onboarding/verify-payment", json=verify_payment_data, headers=headers)
    assert response.status_code == 200
    
    # =========================================================
    # 7. ACCESS DASHBOARD AFTER PAYMENT (SUCCESS)
    # =========================================================
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    dash_json = response.json()
    assert dash_json["tenant"]["industry"] == "Insurance"
    assert dash_json["tenant"]["industry_data"]["leads_count"] == 68
    assert len(dash_json["tenant"]["industry_data"]["policies"]) == 3
    assert dash_json["tenant"]["industry_data"]["policies"][0]["title"] == "Term Life Insurance"


def test_lead_pipeline_gating_and_lifecycle(client):
    # =========================================================
    # 1. SETUP TENANT A (PAID) & TENANT B (UNPAID)
    # =========================================================
    # SignUp Tenant A (Paid)
    response = client.post("/api/v1/onboarding/signup", json={"email": "leada@example.com", "password": "password123"})
    token_a = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_a, "otp": "0000"})
    v_token_a = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_a, "industry": "Real Estate"})
    headers_a = {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    # Pay for Tenant A
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers_a)
    pay_res = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers_a)
    payment_id_a = pay_res.json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={
        "payment_id": payment_id_a,
        "gateway_payment_id": "pay_a_123",
        "gateway_signature": "sig_a_123"
    }, headers=headers_a)

    # SignUp Tenant B (Unpaid)
    response = client.post("/api/v1/onboarding/signup", json={"email": "leadb@example.com", "password": "password123"})
    token_b = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_b, "otp": "0000"})
    v_token_b = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_b, "industry": "IT Training"})
    headers_b = {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    # SignUp Tenant C (Paid, to test tenant isolation)
    response = client.post("/api/v1/onboarding/signup", json={"email": "leadc@example.com", "password": "password123"})
    token_c = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_c, "otp": "0000"})
    v_token_c = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_c, "industry": "Finance"})
    headers_c = {"Authorization": f"Bearer {response.json()['access_token']}"}
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers_c)
    payment_id_c = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers_c).json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={
        "payment_id": payment_id_c,
        "gateway_payment_id": "pay_c_123",
        "gateway_signature": "sig_c_123"
    }, headers=headers_c)

    # =========================================================
    # 2. TEST GATING (Tenant B/Unpaid blocked)
    # =========================================================
    response = client.get("/api/v1/leads", headers=headers_b)
    assert response.status_code == 402
    assert "payment required" in response.json()["detail"].lower()

    response = client.post("/api/v1/leads/import", json={"leads": []}, headers=headers_b)
    assert response.status_code == 402

    # =========================================================
    # 3. TEST CSV TEMPLATE DOWNLOAD (Tenant A/Paid)
    # =========================================================
    response = client.get("/api/v1/leads/template", headers=headers_a)
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "name,phone,email,notes" in response.text

    # =========================================================
    # 4. TEST CSV UPLOAD PREVIEW
    # =========================================================
    csv_content = "Name, Phone, Email, Notes\nAlice Smith, +12345678901, alice@example.com, Notes A\nBob Jones, 9876543210, bob@example.com, Notes B\n"
    files = {"file": ("test.csv", csv_content, "text/csv")}
    response = client.post("/api/v1/leads/upload-preview", files=files, headers=headers_a)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["headers"] == ["name", "phone", "email", "notes"]
    assert len(res_data["preview_rows"]) == 2
    assert res_data["preview_rows"][0]["name"] == "Alice Smith"
    assert res_data["preview_rows"][0]["phone"] == "+12345678901"

    # Test invalid file type
    files = {"file": ("test.txt", "name,phone\n", "text/plain")}
    response = client.post("/api/v1/leads/upload-preview", files=files, headers=headers_a)
    assert response.status_code == 400

    # =========================================================
    # 5. TEST BULK IMPORT WITH VALIDATION
    # =========================================================
    import_payload = {
        "leads": [
            {"name": "Alice Smith", "phone": "+1 (234) 567-8901", "email": "alice@example.com", "notes": "Interested"},
            {"name": "Bob Jones", "phone": "  9876543210  ", "email": "bob@example.com", "notes": "No interest"},
            {"name": "Invalid Phone Lead", "phone": "123", "email": "invalid@example.com"},  # too short
            {"name": "Invalid Email Lead", "phone": "+19999999999", "email": "notanemail"},  # bad email
            {"name": "Empty Name Lead", "phone": "+18888888888", "email": "empty@example.com"},  # empty name
        ]
    }
    # Modify "Empty Name Lead" to have empty name
    import_payload["leads"][4]["name"] = ""

    response = client.post("/api/v1/leads/import", json=import_payload, headers=headers_a)
    assert response.status_code == 200
    res_import = response.json()
    assert res_import["status"] == "success"
    assert res_import["total_received"] == 5
    assert res_import["total_imported"] == 2
    assert res_import["total_failed"] == 3
    assert len(res_import["imported_leads"]) == 2
    assert len(res_import["failed_leads"]) == 3
    
    # Check that phone numbers are cleaned
    imported_ids = res_import["imported_leads"]
    
    # =========================================================
    # 6. TEST LISTING AND SEARCHING
    # =========================================================
    response = client.get("/api/v1/leads", headers=headers_a)
    assert response.status_code == 200
    leads_list = response.json()
    assert len(leads_list) == 2
    # Verify cleaned phones
    phones = [l["phone"] for l in leads_list]
    assert "+12345678901" in phones
    assert "9876543210" in phones

    # Test search
    response = client.get("/api/v1/leads?search=Alice", headers=headers_a)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Alice Smith"

    # =========================================================
    # 7. TEST DUPLICATES PROTECTION
    # =========================================================
    duplicate_payload = {
        "leads": [
            {"name": "Alice Duplicate", "phone": "+12345678901", "email": "alice2@example.com"},  # DB duplicate
            {"name": "Charlie Unique", "phone": "+9999999999", "email": "charlie@example.com"},
            {"name": "Charlie Batch Duplicate", "phone": "+9999999999", "email": "charlie2@example.com"},  # Batch duplicate
        ]
    }
    response = client.post("/api/v1/leads/import", json=duplicate_payload, headers=headers_a)
    assert response.status_code == 200
    res_dup = response.json()
    assert res_dup["total_imported"] == 1
    assert res_dup["total_failed"] == 2
    assert "already exists" in res_dup["failed_leads"][0]["error"].lower()
    assert "duplicate phone number in import batch" in res_dup["failed_leads"][1]["error"].lower()

    # =========================================================
    # 8. TEST KANBAN VIEW
    # =========================================================
    response = client.get("/api/v1/leads/kanban", headers=headers_a)
    assert response.status_code == 200
    res_kanban = response.json()["columns"]
    assert "Imported" in res_kanban
    assert res_kanban["Imported"]["count"] == 3  # Alice, Bob, Charlie
    assert "Pending Queue" in res_kanban
    assert res_kanban["Pending Queue"]["count"] == 0

    # =========================================================
    # 9. TEST STATUS UPDATE API
    # =========================================================
    lead_id = imported_ids[0]
    update_data = {"status": "Pending Queue"}
    response = client.patch(f"/api/v1/leads/{lead_id}/status", json=update_data, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["status"] == "Pending Queue"

    # Verify update on Kanban
    response = client.get("/api/v1/leads/kanban", headers=headers_a)
    res_kanban = response.json()["columns"]
    assert res_kanban["Imported"]["count"] == 2
    assert res_kanban["Pending Queue"]["count"] == 1

    # =========================================================
    # 10. TEST MULTI-TENANCY DATA ISOLATION
    # =========================================================
    # Tenant C trying to read Tenant A's leads directly
    response = client.patch(f"/api/v1/leads/{lead_id}/status", json={"status": "Converted"}, headers=headers_c)
    assert response.status_code == 404

    # Tenant C listing leads: should see empty list (has no leads imported)
    response = client.get("/api/v1/leads", headers=headers_c)
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_campaign_lifecycle(client):
    # =========================================================
    # 1. SETUP TENANTS
    # =========================================================
    # Paid Tenant A
    response = client.post("/api/v1/onboarding/signup", json={"email": "campa@example.com", "password": "password123"})
    token_a = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_a, "otp": "0000"})
    v_token_a = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_a, "industry": "Real Estate"})
    access_token_a = response.json()['access_token']
    headers_a = {"Authorization": f"Bearer {access_token_a}"}
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers_a)
    pay_id_a = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers_a).json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={"payment_id": pay_id_a, "gateway_payment_id": "tx_a", "gateway_signature": "sig_a"}, headers=headers_a)

    # Unpaid Tenant B
    response = client.post("/api/v1/onboarding/signup", json={"email": "campb@example.com", "password": "password123"})
    token_b = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_b, "otp": "0000"})
    v_token_b = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_b, "industry": "IT Training"})
    headers_b = {"Authorization": f"Bearer {response.json()['access_token']}"}

    # Paid Tenant C (isolation checks)
    response = client.post("/api/v1/onboarding/signup", json={"email": "campc@example.com", "password": "password123"})
    token_c = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token_c, "otp": "0000"})
    v_token_c = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token_c, "industry": "Finance"})
    headers_c = {"Authorization": f"Bearer {response.json()['access_token']}"}
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers_c)
    pay_id_c = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers_c).json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={"payment_id": pay_id_c, "gateway_payment_id": "tx_c", "gateway_signature": "sig_c"}, headers=headers_c)

    # =========================================================
    # 2. TEST GATING
    # =========================================================
    response = client.get("/api/v1/campaigns", headers=headers_b)
    assert response.status_code == 402

    # =========================================================
    # 3. CREATE CAMPAIGN
    # =========================================================
    campaign_data = {
        "name": "Q3 Real Estate Campaign",
        "start_time": "00:00",  # set full calling window to pass window checks in tests
        "end_time": "23:59",
        "timezone": "Asia/Kolkata",
        "max_concurrency": 2,
        "retry_delay_minutes": 15,
        "max_retries": 1
    }
    response = client.post("/api/v1/campaigns", json=campaign_data, headers=headers_a)
    assert response.status_code == 201
    campaign_id = response.json()["id"]
    assert response.json()["name"] == "Q3 Real Estate Campaign"
    assert response.json()["status"] == "Draft"

    # =========================================================
    # 4. ASSIGN LEADS TO CAMPAIGN
    # =========================================================
    # Import leads first
    import_payload = {
        "leads": [
            {"name": "Campaign Lead 1", "phone": "+15551111", "email": "lead1@example.com"},
            {"name": "Campaign Lead 2", "phone": "+15552222", "email": "lead2@example.com"}
        ]
    }
    import_res = client.post("/api/v1/leads/import", json=import_payload, headers=headers_a)
    lead_ids = import_res.json()["imported_leads"]
    
    # Assign leads
    response = client.post(f"/api/v1/campaigns/{campaign_id}/leads", json={"lead_ids": lead_ids}, headers=headers_a)
    assert response.status_code == 200
    assert "linked 2 leads" in response.json()["message"].lower()

    # Verify leads status has changed to Pending Queue
    response = client.get("/api/v1/leads", headers=headers_a)
    leads_list = response.json()
    assert all(l["status"] == "Pending Queue" for l in leads_list)
    assert all(l["campaign_id"] == campaign_id for l in leads_list)

    # =========================================================
    # 5. DND BLACKLIST MANAGEMENT
    # =========================================================
    # Add Lead 1 phone to blacklist
    blacklist_data = {"phone": "+15551111", "reason": "DND"}
    response = client.post("/api/v1/campaigns/blacklist", json=blacklist_data, headers=headers_a)
    assert response.status_code == 201
    assert response.json()["phone"] == "+15551111"  # cleaned phone check

    # Verify in list
    response = client.get("/api/v1/campaigns/blacklist", headers=headers_a)
    if response.status_code == 422:
        print("422 ERROR DETAILS:", response.json())
    assert response.status_code == 200
    assert len(response.json()) == 1

    # =========================================================
    # 6. WALLET CHECK ON LAUNCH (SUSPEND GATING)
    # =========================================================
    # Artificially set Tenant A wallet balance to 0 in database
    db = TestingSessionLocal()
    # Resolve tenant A id from JWT
    from app.utils.helpers import decode_access_token
    payload = decode_access_token(access_token_a)
    tenant_id_a = payload["tenant_id"]
    wallet = db.query(Wallet).filter(Wallet.tenant_id == UUID(tenant_id_a)).first()
    wallet.balance = 0
    db.commit()
    db.close()

    # Try to launch: should suspend
    response = client.post(f"/api/v1/campaigns/{campaign_id}/launch", headers=headers_a)
    assert response.status_code == 400
    assert "suspended" in response.json()["detail"].lower()
    
    # Verify campaign status is Suspended
    response = client.get(f"/api/v1/campaigns/{campaign_id}", headers=headers_a)
    assert response.status_code == 200
    assert response.json()["status"] == "Suspended"

    # =========================================================
    # 7. LAUNCH DIALER WITH SIMULATION
    # =========================================================
    # Add balance to Wallet A
    db = TestingSessionLocal()
    wallet = db.query(Wallet).filter(Wallet.tenant_id == UUID(tenant_id_a)).first()
    wallet.balance = 1000 # $10.00
    db.commit()
    db.close()

    # Launch: should succeed and run the dialer background task synchronously in FastAPI test client
    response = client.post(f"/api/v1/campaigns/{campaign_id}/launch", headers=headers_a)
    assert response.status_code == 200
    assert response.json()["status"] == "Active"

    # Verify Dialer simulated results
    # 1. Lead 1 (blacklist/DND) must be skipped (status: Not Interested, disposition: DND Skip)
    # 2. Lead 2 must be processed (either Converted with Answered or Pending Queue with retry logic applied)
    response = client.get("/api/v1/leads", headers=headers_a)
    leads_after_dial = response.json()
    
    lead1 = next(l for l in leads_after_dial if l["phone"] == "+15551111")
    lead2 = next(l for l in leads_after_dial if l["phone"] == "+15552222")

    assert lead1["status"] == "Not Interested"
    assert lead1["call_disposition"] == "DND Skip"

    assert lead2["status"] in ["Converted", "Pending Queue", "Not Interested"]
    assert lead2["call_disposition"] in ["Answered", "Busy", "No Answer", "Max Retries Reached"]

    # =========================================================
    # 8. SUSPEND CAMPAIGN
    # =========================================================
    response = client.post(f"/api/v1/campaigns/{campaign_id}/suspend", headers=headers_a)
    assert response.status_code == 200
    assert response.json()["status"] == "Suspended"

    # =========================================================
    # 9. TENANT ISOLATION
    # =========================================================
    response = client.get(f"/api/v1/campaigns/{campaign_id}", headers=headers_c)
    assert response.status_code == 404


def test_live_monitoring_websockets(client):
    # Setup Tenant
    response = client.post("/api/v1/onboarding/signup", json={"email": "livemon@example.com", "password": "password123"})
    token = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token, "otp": "0000"})
    v_token = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token, "industry": "Real Estate"})
    access_token = response.json()['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Paid plan gating
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers)
    pay_id = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers).json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={"payment_id": pay_id, "gateway_payment_id": "tx_live", "gateway_signature": "sig_live"}, headers=headers)

    # 1. Create Campaign
    campaign_res = client.post("/api/v1/campaigns", json={
        "name": "Live Mon Campaign",
        "start_time": "00:00",
        "end_time": "23:59",
        "timezone": "Asia/Kolkata",
        "max_concurrency": 2,
        "retry_delay_minutes": 15,
        "max_retries": 1
    }, headers=headers)
    assert campaign_res.status_code == 201
    campaign_id = campaign_res.json()["id"]

    # 2. Add Lead
    import_res = client.post("/api/v1/leads/import", json={
        "leads": [{"name": "Live Lead 1", "phone": "+1999777", "email": "live@example.com"}]
    }, headers=headers)
    lead_id = import_res.json()["imported_leads"][0]

    # Assign Lead
    client.post(f"/api/v1/campaigns/{campaign_id}/leads", json={"lead_ids": [lead_id]}, headers=headers)

    # Add balance to Wallet
    db = TestingSessionLocal()
    from app.utils.helpers import decode_access_token
    from app.models.wallet import Wallet
    payload = decode_access_token(access_token)
    tenant_id_str = payload["tenant_id"]
    wallet = db.query(Wallet).filter(Wallet.tenant_id == UUID(tenant_id_str)).first()
    wallet.balance = 500
    db.commit()
    db.close()

    # 3. Test Connecting WebSocket and Receiving Status Updates
    with client.websocket_connect(f"/api/v1/campaigns/{campaign_id}/ws?token={access_token}") as ws:
        # Launch campaign: triggers BackgroundTask synchronously
        launch_res = client.post(f"/api/v1/campaigns/{campaign_id}/launch", headers=headers)
        assert launch_res.status_code == 200

        # Receive Connected status update
        frame1 = ws.receive_json()
        assert frame1["event"] == "status_update"
        assert frame1["lead_id"] == str(lead_id)
        assert frame1["status"] == "Connected"

        # Receive Converted/Failed status update
        frame2 = ws.receive_json()
        assert frame2["event"] == "status_update"
        assert frame2["lead_id"] == str(lead_id)
        assert frame2["status"] in ["Converted", "Pending Queue", "Not Interested"]

    # 4. Test Transcript WebSocket
    with client.websocket_connect(f"/api/v1/campaigns/{campaign_id}/leads/{lead_id}/transcript/ws?token={access_token}") as ws_trans:
        pass


def test_call_logs_and_dynamic_analytics(client):
    # Setup Tenant
    response = client.post("/api/v1/onboarding/signup", json={"email": "analytics@example.com", "password": "password123"})
    token = response.json()["signup_token"]
    response = client.post("/api/v1/onboarding/verify-otp", json={"signup_token": token, "otp": "0000"})
    v_token = response.json()["verified_token"]
    response = client.post("/api/v1/onboarding/select-industry", json={"verified_token": v_token, "industry": "Real Estate"})
    access_token = response.json()['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Paid subscription setup
    client.post("/api/v1/onboarding/select-plan", json={"plan_id": "pro"}, headers=headers)
    pay_id = client.post("/api/v1/onboarding/create-payment", json={"gateway": "MOCK"}, headers=headers).json()["payment_id"]
    client.post("/api/v1/onboarding/verify-payment", json={"payment_id": pay_id, "gateway_payment_id": "tx_anal", "gateway_signature": "sig_anal"}, headers=headers)

    # 1. Create Campaign
    campaign_res = client.post("/api/v1/campaigns", json={
        "name": "Analytics Campaign",
        "start_time": "00:00",
        "end_time": "23:59",
        "timezone": "Asia/Kolkata",
        "max_concurrency": 2,
        "retry_delay_minutes": 15,
        "max_retries": 1
    }, headers=headers)
    assert campaign_res.status_code == 201
    campaign_id = campaign_res.json()["id"]

    # 2. Import a Lead
    import_res = client.post("/api/v1/leads/import", json={
        "leads": [{"name": "Lead Test", "phone": "+19998888", "email": "test@example.com"}]
    }, headers=headers)
    lead_id = import_res.json()["imported_leads"][0]

    # Assign Lead to Campaign
    client.post(f"/api/v1/campaigns/{campaign_id}/leads", json={"lead_ids": [lead_id]}, headers=headers)

    # Add balance to Wallet
    db = TestingSessionLocal()
    from app.utils.helpers import decode_access_token
    from app.models.wallet import Wallet
    payload = decode_access_token(access_token)
    tenant_id_str = payload["tenant_id"]
    wallet = db.query(Wallet).filter(Wallet.tenant_id == UUID(tenant_id_str)).first()
    wallet.balance = 1000
    db.commit()
    db.close()

    # 3. Launch Campaign to trigger dialer outcomes and CallLog generation
    launch_res = client.post(f"/api/v1/campaigns/{campaign_id}/launch", headers=headers)
    assert launch_res.status_code == 200

    # 4. Query Call Logs list
    call_logs_res = client.get("/api/v1/call-logs", headers=headers)
    assert call_logs_res.status_code == 200
    call_logs = call_logs_res.json()
    assert len(call_logs) >= 1
    
    call_log = call_logs[0]
    assert call_log["lead_id"] == str(lead_id)
    assert call_log["campaign_id"] == str(campaign_id)
    assert "call_disposition" in call_log
    
    if call_log["call_disposition"] == "Answered":
        assert call_log["call_duration"] > 0
        assert call_log["recording_url"] is not None
        assert "s3.amazonaws.com" in call_log["recording_url"]
        assert call_log["ai_summary"] is not None
        assert call_log["intent_tag"] == "Warm Lead"
        assert len(call_log["transcript"]) > 0

    # 5. Get specific Call Log details
    detail_res = client.get(f"/api/v1/call-logs/{call_log['id']}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == call_log["id"]

    # 6. Test dynamic dashboard metrics
    dash_res = client.get("/api/v1/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_json = dash_res.json()
    assert dash_json["tenant"]["industry_data"]["leads_count"] == 1
    assert dash_json["tenant"]["industry_data"]["total_calls"] >= 1
    assert "connection_rate" in dash_json["tenant"]["industry_data"]




