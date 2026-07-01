# tests/test_admin_and_tools.py

import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import UUID, uuid4

from app.main import app
from app.database.connection import get_db, Base
from app.models import (
    User, UserRole, Tenant, PromptVersion, ToolSchema, Document, Lead, LeadStatus, BlacklistedNumber, BlacklistedToken
)
from app.controllers import auth_controller
from app.controllers.voice_orchestrator import execute_tool, query_gpt4o_dialogue

TEST_DATABASE_URL = "sqlite:///./test_admin_tools.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_admin_tools.db"):
        try:
            os.remove("./test_admin_tools.db")
        except Exception:
            pass

@pytest.fixture
def db():
    db_session = TestingSessionLocal()
    yield db_session
    db_session.close()

@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)

@pytest.fixture
def auth_headers(db):
    tenant = db.query(Tenant).filter(Tenant.slug == "test-dynamic-inc").first()
    if not tenant:
        # 1. Create a Tenant
        tenant_id = uuid4()
        tenant = Tenant(
            id=tenant_id,
            company_name="Test Dynamic Inc",
            slug="test-dynamic-inc",
            company_email="admin@testdynamic.com",
            is_active=True,
            is_verified=True,
            is_onboarding_completed=True,
            system_prompt="Initial Prompt"
        )
        db.add(tenant)
        db.flush()

        # 2. Create User
        from app.utils.helpers import hash_password
        user = User(
            tenant_id=tenant_id,
            username="dynamicadmin",
            email="admin@testdynamic.com",
            hashed_password=hash_password("adminpassword"),
            role=UserRole.BUSINESS_OWNER,
            is_active=True
        )
        db.add(user)
        db.commit()

    # 3. Authenticate to get JWT token
    from app.utils.helpers import create_access_token
    token = create_access_token(data={"sub": "dynamicadmin"})
    return {"Authorization": f"Bearer {token}"}

# ---------------------------------------------------------
# TESTS
# ---------------------------------------------------------

def test_prompt_versioning_flow(client, auth_headers, db):
    # Get current tenant
    tenant = db.query(Tenant).filter(Tenant.slug == "test-dynamic-inc").first()
    assert tenant is not None

    # 1. Create prompt version
    payload = {"prompt_text": "You are assistant version 2, polite and professional."}
    response = client.post("/api/v1/admin/prompts", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["version"] == 1
    assert data["prompt_text"] == payload["prompt_text"]
    assert data["is_active"] is True

    prompt_v1_id = data["id"]

    # 2. Create a second prompt version
    payload_v2 = {"prompt_text": "You are assistant version 3, enthusiastic and quick."}
    response2 = client.post("/api/v1/admin/prompts", json=payload_v2, headers=auth_headers)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["version"] == 2
    assert data2["is_active"] is True

    prompt_v2_id = data2["id"]

    # Prompt 1 should be inactive now
    db.refresh(tenant)
    assert tenant.system_prompt_version == 2
    assert tenant.system_prompt == payload_v2["prompt_text"]

    # 3. List prompt versions
    list_res = client.get("/api/v1/admin/prompts", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 2
    assert items[0]["version"] == 2

    # 4. Activate Prompt 1 again
    act_res = client.put(f"/api/v1/admin/prompts/{prompt_v1_id}/activate", headers=auth_headers)
    assert act_res.status_code == 200
    assert act_res.json()["is_active"] is True

    db.refresh(tenant)
    assert tenant.system_prompt_version == 1
    assert tenant.system_prompt == payload["prompt_text"]

    # 5. Attempt deleting active prompt should fail
    del_fail = client.delete(f"/api/v1/admin/prompts/{prompt_v1_id}", headers=auth_headers)
    assert del_fail.status_code == 400

    # 6. Delete inactive prompt should succeed
    del_ok = client.delete(f"/api/v1/admin/prompts/{prompt_v2_id}", headers=auth_headers)
    assert del_ok.status_code == 200
    
    # Confirm in DB
    prompts = db.query(PromptVersion).filter(PromptVersion.tenant_id == tenant.id).all()
    assert len(prompts) == 1

def test_tool_registration_flow(client, auth_headers, db):
    tenant = db.query(Tenant).filter(Tenant.slug == "test-dynamic-inc").first()
    
    # 1. Register a tool
    payload = {
        "name": "book_callback",
        "description": "Book a free admissions callback.",
        "json_schema": {
            "type": "object",
            "properties": {
                "date": {"type": "string"},
                "time": {"type": "string"}
            },
            "required": ["date", "time"]
        }
    }
    response = client.post("/api/v1/admin/tools", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "book_callback"
    assert data["json_schema"] == payload["json_schema"]

    tool_id = data["id"]

    # 2. List tools
    list_res = client.get("/api/v1/admin/tools", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1

    # 3. Bootstrap default tools
    boot_res = client.post("/api/v1/admin/tools/bootstrap", headers=auth_headers)
    assert boot_res.status_code == 200
    boot_items = boot_res.json()
    # Check that at least 5 default tools are registered
    assert len(boot_items) >= 5

    # 4. Remove a tool
    del_res = client.delete(f"/api/v1/admin/tools/{tool_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_knowledge_file_listing_and_deletion(client, auth_headers, db):
    tenant = db.query(Tenant).filter(Tenant.slug == "test-dynamic-inc").first()

    # Create dummy Document
    doc = Document(
        tenant_id=tenant.id,
        file_name="syllabi.pdf",
        file_url="/uploads/syllabi.pdf",
        status="COMPLETED"
    )
    db.add(doc)
    db.commit()

    doc_id = doc.id

    # List knowledge files
    list_res = client.get("/api/v1/admin/knowledge/files", headers=auth_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 1
    assert items[0]["file_name"] == "syllabi.pdf"

    # Delete knowledge file
    del_res = client.delete(f"/api/v1/admin/knowledge/files/{doc_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify deleted
    db.refresh(tenant)
    db_doc = db.query(Document).filter(Document.id == doc_id).first()
    assert db_doc is None

def test_execute_tool_actions(db):
    import asyncio
    # Setup Tenant and Lead
    tenant_id = uuid4()
    tenant = Tenant(
        id=tenant_id,
        company_name="Test Dynamic Inc 2",
        slug="test-dynamic-inc-2",
        company_email="admin2@testdynamic.com",
        is_active=True
    )
    db.add(tenant)
    
    lead_id = uuid4()
    lead = Lead(
        id=lead_id,
        tenant_id=tenant_id,
        name="John Doe",
        phone="+123456789",
        status="Imported",
        notes="Old note"
    )
    db.add(lead)
    db.commit()

    db_session_factory = lambda: TestingSessionLocal()

    # 1. Test book_callback tool
    res = asyncio.run(execute_tool(
        name="book_callback",
        arguments={"date": "2026-07-01", "time": "2:00 PM"},
        tenant_id=str(tenant_id),
        lead_id=str(lead_id),
        db_session_factory=db_session_factory
    ))
    assert "scheduled successfully" in res
    
    # Verify DB update
    db.refresh(lead)
    assert "[CALLBACK BOOKED: 2026-07-01 at 2:00 PM]" in lead.notes

    # 2. Test calculate_premium
    res2 = asyncio.run(execute_tool(
        name="calculate_premium",
        arguments={"age": 35, "policy_type": "term", "coverage_amount": 300000},
        tenant_id=str(tenant_id),
        lead_id=str(lead_id),
        db_session_factory=db_session_factory
    ))
    assert "monthly premium" in res2

    # 3. Test update_lead_status
    res3 = asyncio.run(execute_tool(
        name="update_lead_status",
        arguments={"status": "Converted"},
        tenant_id=str(tenant_id),
        lead_id=str(lead_id),
        db_session_factory=db_session_factory
    ))
    assert "status updated" in res3
    db.refresh(lead)
    assert lead.status == "Converted"

    # 4. Test blacklist_number
    res4 = asyncio.run(execute_tool(
        name="blacklist_number",
        arguments={"phone": "+123456789", "reason": "User DND request"},
        tenant_id=str(tenant_id),
        lead_id=str(lead_id),
        db_session_factory=db_session_factory
    ))
    assert "blacklisted successfully" in res4
    db.refresh(lead)
    assert lead.status == "Not Interested"

    blacklist_entry = db.query(BlacklistedNumber).filter(
        BlacklistedNumber.tenant_id == tenant_id,
        BlacklistedNumber.phone == "+123456789"
    ).first()
    assert blacklist_entry is not None
    assert blacklist_entry.reason == "User DND request"

def test_ivr_language_selection(client):
    campaign_id = str(uuid4())
    lead_id = str(uuid4())
    
    # 1. Test outbound-twiml returns Connect and Stream
    res = client.post(f"/api/v1/telephony/outbound-twiml?campaign_id={campaign_id}&lead_id={lead_id}")
    assert res.status_code == 200
    assert "Connect" in res.text
    assert "Stream" in res.text
    assert "language" in res.text
    assert "auto" in res.text



