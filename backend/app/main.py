from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.database.connection import engine, Base
from app.routes import auth_routes, user_routes, tenant_routes, onboarding_routes, lead_routes, campaign_routes, live_routes, call_log_routes, telephony_routes, admin_routes

import sys

# Automatically build database tables and apply schema migrations (skip during testing)
if "pytest" not in sys.modules:
    Base.metadata.create_all(bind=engine)
    from app.database.connection import seed_default_plans, apply_database_migrations
    apply_database_migrations(engine)
    seed_default_plans()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for AI-BOT, structured dynamically with MVC pattern.",
    version="1.0.0",
    debug=settings.DEBUG,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS setup
if settings.DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register routes under standard version prefix
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(auth_routes.dashboard_router, prefix="/api/v1")
app.include_router(user_routes.router, prefix="/api/v1")
app.include_router(tenant_routes.router, prefix="/api/v1")
app.include_router(onboarding_routes.router, prefix="/api/v1")
app.include_router(lead_routes.router, prefix="/api/v1")
app.include_router(campaign_routes.router, prefix="/api/v1")
app.include_router(live_routes.router, prefix="/api/v1")
app.include_router(call_log_routes.router, prefix="/api/v1")
app.include_router(telephony_routes.router, prefix="/api/v1")
app.include_router(admin_routes.router, prefix="/api/v1")

@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "message": "Backend is running 🚀" # reload trigger
    }
