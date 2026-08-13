# tests/test_company_verification.py

import pytest
import io
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.connection import Base, get_db, apply_database_migrations
from app.models.user_model import User, UserRole
from app.models.tenant import Tenant, TenantVerificationStatus
from app.models.document import Document
from app.models.wallet import Wallet
from app.utils.helpers import hash_password, create_access_token

# Test Database Engine using isolated SQLite in-memory or file
TEST_DATABASE_URL = "sqlite:///./test_company_verification.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

from app.models.plan import Plan

@pytest.fixture(autouse=True)
def setup_db():
    """Reset database tables before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    apply_database_migrations(engine)
    
    db = TestingSessionLocal()
    if not db.query(Plan).filter(Plan.id == "pro").first():
        pro_plan = Plan(id="pro", name="Pro", price=4999, max_users=10, max_campaigns=20)
        db.add(pro_plan)
    if not db.query(Plan).filter(Plan.id == "basic").first():
        basic_plan = Plan(id="basic", name="Basic", price=2499, max_users=2, max_campaigns=5)
        db.add(basic_plan)
    db.commit()
    db.close()
    yield

def create_test_user_and_tenant(
    email: str = "user@company.com",
    role: UserRole = UserRole.BUSINESS_OWNER,
    verification_status: TenantVerificationStatus = TenantVerificationStatus.PENDING,
    country: str = "INDIA"
):
    """Helper to create a tenant and user with specific verification status."""
    db = TestingSessionLocal()
    tenant_id = uuid.uuid4()
    
    # Existing active/verified condition
    is_act = verification_status == TenantVerificationStatus.APPROVED
    unique_num = uuid.uuid4().hex[:8]
    
    tenant = Tenant(
        id=tenant_id,
        company_name="Test Company",
        slug=f"test-company-{unique_num}",
        company_email=email,
        company_phone=f"+919{unique_num[:9]}",
        country=country,
        owner_name="Test Owner",
        registered_address="123 Test Street",
        verification_status=verification_status,
        is_active=is_act,
        is_verified=is_act,
        is_payment_done=True
    )
    db.add(tenant)

    user = User(
        username=email.split("@")[0],
        email=email,
        hashed_password=hash_password("Password123!"),
        role=role,
        tenant_id=tenant_id,
        is_active=True
    )
    db.add(user)

    # Initialize wallet
    wallet = Wallet(tenant_id=tenant_id, balance=100.0, currency="USD")
    db.add(wallet)

    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.username, "tenant_id": str(tenant_id), "role": role.value})
    db.close()
    return user, tenant, token

# =====================================================================
# 1. VERIFICATION STATUS GET ENDPOINTS & AUTH/ME
# =====================================================================

def test_get_verification_status():
    user, tenant, token = create_test_user_and_tenant()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/tenant/company-verification/status", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["country"] == "INDIA"
    assert data["company_name"] == "Test Company"

def test_get_me_includes_verification():
    user, tenant, token = create_test_user_and_tenant()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "verification" in data
    assert data["verification"]["status"] == "PENDING"

# =====================================================================
# 2. INDIA VERIFICATION VALIDATION TESTS
# =====================================================================

def test_india_verification_with_gst_doc():
    user, tenant, token = create_test_user_and_tenant(email="india_gst@company.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Reset status to NEW / clear pending to allow submit
    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    gst_file = ("gst.pdf", b"%PDF-1.4 Fake GST Certificate Content", "application/pdf")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "India Tech Pvt Ltd",
            "company_email": "india_gst@company.com",
            "phone_number": "+919876543210",
            "owner_name": "Rajesh Kumar",
            "registered_office_address": "MG Road, Bengaluru, India"
        },
        files={"gst_doc": gst_file}
    )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["country"] == "INDIA"

def test_india_verification_with_incorporation_doc():
    user, tenant, token = create_test_user_and_tenant(email="india_inc@company.com")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    inc_file = ("incorporation.png", b"\x89PNG\r\n\x1a\nFake PNG Data", "image/png")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "India Startup Pvt Ltd",
            "company_email": "india_inc@company.com",
            "phone_number": "+919876543211",
            "owner_name": "Priya Sharma",
            "registered_office_address": "HSR Layout, Bengaluru"
        },
        files={"incorporation_doc": inc_file}
    )

    assert res.status_code == 200
    assert res.json()["status"] == "PENDING"

def test_india_verification_fails_without_required_doc():
    user, tenant, token = create_test_user_and_tenant(email="nodoc@company.com")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "No Doc Pvt Ltd",
            "company_email": "nodoc@company.com",
            "phone_number": "+919876543212",
            "owner_name": "Amit Kumar",
            "registered_office_address": "Indiranagar, Bengaluru"
        }
    )

    assert res.status_code == 400
    assert "at least one document" in res.json()["detail"].lower()

# =====================================================================
# 3. UNITED KINGDOM VALIDATION TESTS
# =====================================================================

def test_uk_verification_success():
    user, tenant, token = create_test_user_and_tenant(email="uk_company@uk.com", country="UNITED_KINGDOM")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    cert_file = ("companies_house.pdf", b"%PDF-1.4 UK Companies House Certificate", "application/pdf")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "UNITED_KINGDOM",
            "company_name": "UK Tech Ltd",
            "company_email": "uk_company@uk.com",
            "phone_number": "+442079460912",
            "owner_name": "James Smith",
            "registered_office_address": "10 Downing Street, London",
            "company_number": "12345678"
        },
        files={"companies_house_doc": cert_file}
    )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["country"] == "UNITED_KINGDOM"
    assert data["company_number"] == "12345678"

def test_uk_verification_fails_missing_company_number():
    user, tenant, token = create_test_user_and_tenant(email="uk_nocode@uk.com", country="UNITED_KINGDOM")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    cert_file = ("companies_house.pdf", b"%PDF-1.4 UK Certificate", "application/pdf")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "UNITED_KINGDOM",
            "company_name": "UK Tech Ltd",
            "company_email": "uk_nocode@uk.com",
            "phone_number": "+442079460912",
            "owner_name": "James Smith",
            "registered_office_address": "London",
            "company_number": ""
        },
        files={"companies_house_doc": cert_file}
    )

    assert res.status_code == 400
    assert "company_number" in res.json()["detail"].lower()

# =====================================================================
# 4. FILE VALIDATION TESTS
# =====================================================================

def test_file_validation_unsupported_extension():
    user, tenant, token = create_test_user_and_tenant(email="badext@company.com")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    bad_file = ("malicious.exe", b"MZ Executable binary header", "application/x-msdownload")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "Bad Ext Pvt Ltd",
            "company_email": "badext@company.com",
            "phone_number": "+919876543215",
            "owner_name": "Test",
            "registered_office_address": "Addr"
        },
        files={"gst_doc": bad_file}
    )

    assert res.status_code == 400
    assert "unsupported file extension" in res.json()["detail"].lower()

def test_file_validation_empty_file():
    user, tenant, token = create_test_user_and_tenant(email="emptyfile@company.com")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.verification_status = TenantVerificationStatus.REJECTED
    db.commit()
    db.close()

    empty_file = ("empty.pdf", b"", "application/pdf")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "Empty Pvt Ltd",
            "company_email": "emptyfile@company.com",
            "phone_number": "+919876543216",
            "owner_name": "Test",
            "registered_office_address": "Addr"
        },
        files={"gst_doc": empty_file}
    )

    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()

# =====================================================================
# 5. ACCESS CONTROL PERMISSION MATRIX TESTS
# =====================================================================

def test_pending_status_blocks_mutating_endpoints():
    user, tenant, token = create_test_user_and_tenant(verification_status=TenantVerificationStatus.PENDING)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Campaign Creation should be BLOCKED with 403 COMPANY_VERIFICATION_REQUIRED
    res = client.post(
        "/api/v1/campaigns",
        headers=headers,
        json={"name": "New Campaign", "type": "outbound", "voice_id": "rachel", "system_prompt": "Hello"}
    )
    assert res.status_code == 403
    detail = res.json()["detail"]
    assert detail["code"] == "COMPANY_VERIFICATION_REQUIRED"
    assert detail["status"] == "PENDING"

    # 2. Lead Import should be BLOCKED
    res = client.post(
        "/api/v1/leads/import",
        headers=headers,
        json={"leads": [{"name": "Lead 1", "phone": "+15550199"}]}
    )
    assert res.status_code == 403

    # 3. Wallet Recharge should be BLOCKED
    res = client.post("/api/v1/tenant/wallet/recharge", headers=headers, json={"amount": 50.0})
    assert res.status_code == 403

def test_pending_status_allows_read_only_get_endpoints():
    user, tenant, token = create_test_user_and_tenant(verification_status=TenantVerificationStatus.PENDING)
    headers = {"Authorization": f"Bearer {token}"}

    # GET campaigns -> ALLOWED
    res = client.get("/api/v1/campaigns", headers=headers)
    assert res.status_code == 200

    # GET leads -> ALLOWED
    res = client.get("/api/v1/leads", headers=headers)
    assert res.status_code == 200

    # GET dashboard -> ALLOWED
    res = client.get("/api/v1/dashboard", headers=headers)
    assert res.status_code == 200

def test_rejected_status_blocks_mutations_with_reason():
    user, tenant, token = create_test_user_and_tenant(verification_status=TenantVerificationStatus.REJECTED)
    
    db = TestingSessionLocal()
    t = db.query(Tenant).filter(Tenant.id == tenant.id).first()
    t.rejection_reason = "Invalid incorporation certificate uploaded."
    db.commit()
    db.close()

    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/campaigns",
        headers=headers,
        json={"name": "New Campaign", "type": "outbound", "voice_id": "rachel", "system_prompt": "Hello"}
    )
    assert res.status_code == 403
    detail = res.json()["detail"]
    assert detail["code"] == "COMPANY_VERIFICATION_REJECTED"
    assert detail["status"] == "REJECTED"
    assert "Invalid incorporation certificate" in detail["rejection_reason"]

def test_approved_status_allows_all_operations():
    user, tenant, token = create_test_user_and_tenant(verification_status=TenantVerificationStatus.APPROVED)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/campaigns",
        headers=headers,
        json={"name": "New Campaign", "type": "outbound", "voice_id": "rachel", "system_prompt": "Hello"}
    )
    assert res.status_code == 201

# =====================================================================
# 6. SUPER ADMIN VERIFICATION & WORKFLOW TESTS
# =====================================================================

def test_super_admin_approve_and_reject_flow():
    # 1. Create Pending Tenant User
    user, tenant, token = create_test_user_and_tenant(email="pending_biz@co.com", verification_status=TenantVerificationStatus.PENDING)
    
    # 2. Create Super Admin User
    admin_user, admin_tenant, admin_token = create_test_user_and_tenant(email="admin@system.com", role=UserRole.SUPER_ADMIN)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {token}"}

    # 3. Super Admin list pending verifications
    res = client.get("/api/v1/admin/company-verifications?status_filter=PENDING", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1

    # 4. Super Admin view verification detail
    res = client.get(f"/api/v1/admin/company-verifications/{tenant.id}", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["company_id"] == str(tenant.id)

    # 5. Normal user attempts to approve themselves -> REJECTED 403
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/approve", headers=user_headers)
    assert res.status_code == 403

    # 6. Super Admin approves tenant
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/approve", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "APPROVED"

    # 7. Super Admin suspends tenant
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/suspend", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "SUSPENDED"

    # 8. Super Admin reactivates tenant
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/reactivate", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "APPROVED"

def test_super_admin_rejection_requires_reason():
    user, tenant, token = create_test_user_and_tenant(email="reject_me@co.com", verification_status=TenantVerificationStatus.PENDING)
    admin_user, admin_tenant, admin_token = create_test_user_and_tenant(email="admin2@system.com", role=UserRole.SUPER_ADMIN)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Reject without reason -> 400
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/reject", headers=admin_headers, json={"reason": ""})
    assert res.status_code == 400

    # Reject with valid reason -> 200
    res = client.post(f"/api/v1/admin/company-verifications/{tenant.id}/reject", headers=admin_headers, json={"reason": "Invalid document"})
    assert res.status_code == 200
    assert res.json()["verification_status"] == "REJECTED"

def test_onboarding_company_verification_with_verified_token():
    # Simulate verified_token returned after OTP verification
    verified_payload = {
        "username": "onboard_user",
        "email": "onboard@company.com",
        "hashed_password": hash_password("Password123!"),
        "role": UserRole.BUSINESS_OWNER.value,
        "tenant_id": str(uuid.uuid4()),
        "company_name": "Onboard Workspace",
        "company_slug": "onboard-workspace",
        "full_name": "Onboard User",
        "otp_verified": True
    }
    verified_token = create_access_token(data=verified_payload)
    headers = {"Authorization": f"Bearer {verified_token}"}

    gst_file = ("gst_cert.pdf", b"%PDF-1.4 Fake GST Cert Content", "application/pdf")

    res = client.post(
        "/api/v1/tenant/company-verification",
        headers=headers,
        data={
            "country": "INDIA",
            "company_name": "Onboard Tech Pvt Ltd",
            "company_email": "onboard@company.com",
            "phone_number": "+919999988888",
            "owner_name": "Onboard Owner",
            "registered_office_address": "Tech Park, Bengaluru"
        },
        files={"gst_doc": gst_file}
    )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING"
    assert data["company_name"] == "Onboard Tech Pvt Ltd"
    assert data["verified_token"] is not None

    # Complete onboarding with the updated token
    new_verified_token = data["verified_token"]
    comp_res = client.post(
        "/api/v1/onboarding/complete",
        json={
            "verified_token": new_verified_token,
            "plan": "pro",
            "payment_method": "card",
            "card_number": "4242424242424242",
            "card_cvc": "123"
        }
    )
    assert comp_res.status_code == 200
    tokens = comp_res.json()
    assert "access_token" in tokens



