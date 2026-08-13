from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config.settings import settings
import urllib.parse

# SQLite connection requires check_same_thread: False
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Auto-create PostgreSQL database if it does not exist
    if settings.DB_HOST and settings.DB_USER and settings.DB_PASSWORD and settings.DB_NAME:
        db_name = settings.DB_NAME
        db_user = settings.DB_USER
        db_password = settings.DB_PASSWORD
        db_host = settings.DB_HOST
        
        encoded_password = urllib.parse.quote(str(db_password))
        admin_db_url = f"postgresql://{db_user}:{encoded_password}@{db_host}/postgres"
        
        try:
            # Check connection to the target database
            temp_engine = create_engine(settings.DATABASE_URL)
            with temp_engine.connect() as conn:
                pass
            temp_engine.dispose()
        except Exception as e:
            if "does not exist" in str(e):
                try:
                    admin_engine = create_engine(admin_db_url)
                    with admin_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
                        result = conn.execute(text("SELECT 1 FROM pg_database WHERE datname = :dbname"), {"dbname": db_name})
                        if not result.scalar():
                            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                    admin_engine.dispose()
                except Exception:
                    pass

engine = create_engine(
    settings.DATABASE_URL, connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DB dependency to yield session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_default_plans():
    from app.models.plan import Plan
    db = SessionLocal()
    try:
        plans_data = [
            {
                "id": "basic",
                "name": "Basic",
                "price": 29.0,
                "billing_cycle": "monthly",
                "features": {
                    "list": [
                        "Up to 5 team users",
                        "Up to 10 active campaigns",
                        "1,000 monthly calls included",
                        "Outbound AI calling pipeline",
                        "Basic CRM & Lead management"
                    ]
                },
                "max_users": 5,
                "max_campaigns": 10,
                "max_monthly_calls": 1000
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 79.0,
                "billing_cycle": "monthly",
                "features": {
                    "list": [
                        "Up to 15 team users",
                        "Unlimited active campaigns",
                        "5,000 monthly calls included",
                        "Advanced RAG knowledge base integration",
                        "Semantic interruption handling",
                        "Live call monitoring & summaries"
                    ]
                },
                "max_users": 15,
                "max_campaigns": 999999,
                "max_monthly_calls": 5000
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": 249.0,
                "billing_cycle": "monthly",
                "features": {
                    "list": [
                        "Unlimited team users",
                        "Unlimited active campaigns",
                        "Unlimited calls (metered billing)",
                        "Dedicated custom voice options",
                        "24/7 custom support & priority setup",
                        "Advanced compliance & custom audit logs"
                    ]
                },
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
    except Exception as e:
        print(f"Error seeding plans: {e}")
        db.rollback()
    finally:
        db.close()
def apply_database_migrations(target_engine=None):
    """
    Safely inspect and add missing verification columns & audit table.
    Migrates existing active/verified tenants to APPROVED so existing accounts remain fully functional.
    """
    if target_engine is None:
        target_engine = engine

    with target_engine.connect() as conn:
        dialect_name = target_engine.dialect.name
        
        # 1. Tenants table columns check
        tenant_columns = []
        if dialect_name == "sqlite":
            res = conn.execute(text("PRAGMA table_info(tenants)"))
            tenant_columns = [row[1] for row in res.fetchall()]
        elif dialect_name == "postgresql":
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tenants'"))
            tenant_columns = [row[0] for row in res.fetchall()]

        if tenant_columns:
            if "country" not in tenant_columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN country VARCHAR(100) DEFAULT 'INDIA'"))
            if "verified_at" not in tenant_columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN verified_at TIMESTAMP"))
            if "verified_by" not in tenant_columns:
                if dialect_name == "postgresql":
                    conn.execute(text("ALTER TABLE tenants ADD COLUMN verified_by UUID"))
                else:
                    conn.execute(text("ALTER TABLE tenants ADD COLUMN verified_by VARCHAR(36)"))
            if "submitted_at" not in tenant_columns:
                conn.execute(text("ALTER TABLE tenants ADD COLUMN submitted_at TIMESTAMP"))

        # 2. Documents table columns check
        doc_columns = []
        if dialect_name == "sqlite":
            res = conn.execute(text("PRAGMA table_info(documents)"))
            doc_columns = [row[1] for row in res.fetchall()]
        elif dialect_name == "postgresql":
            res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='documents'"))
            doc_columns = [row[0] for row in res.fetchall()]

        if doc_columns:
            if "document_type" not in doc_columns:
                conn.execute(text("ALTER TABLE documents ADD COLUMN document_type VARCHAR(100)"))
            if "mime_type" not in doc_columns:
                conn.execute(text("ALTER TABLE documents ADD COLUMN mime_type VARCHAR(100)"))
            if "file_size" not in doc_columns:
                conn.execute(text("ALTER TABLE documents ADD COLUMN file_size BIGINT"))
            if "uploaded_by" not in doc_columns:
                if dialect_name == "postgresql":
                    conn.execute(text("ALTER TABLE documents ADD COLUMN uploaded_by UUID"))
                else:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN uploaded_by VARCHAR(36)"))
            if "verification_status" not in doc_columns:
                conn.execute(text("ALTER TABLE documents ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING'"))

        # 3. Existing tenants migration strategy: Set active/verified existing tenants to APPROVED
        if tenant_columns:
            try:
                if dialect_name == "postgresql":
                    conn.execute(text("UPDATE tenants SET verification_status = 'APPROVED' WHERE (is_active = TRUE OR is_verified = TRUE) AND (submitted_at IS NULL OR verification_status = 'PENDING')"))
                else:
                    conn.execute(text("UPDATE tenants SET verification_status = 'APPROVED' WHERE (is_active = 1 OR is_verified = 1) AND (submitted_at IS NULL OR verification_status = 'PENDING')"))
            except Exception as e:
                print(f"[MIGRATION WARNING] Could not set existing tenants to APPROVED: {e}")

        conn.commit()
