# controllers/subscription_controller.py

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.plan import Plan

def get_subscription_by_tenant(db: Session, tenant_id: UUID) -> Subscription:
    """Fetch the active subscription record associated with a tenant."""
    return db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()

def create_or_update_subscription(
    db: Session,
    tenant_id: UUID,
    plan_id: str
) -> Subscription:
    """Initialize or upgrade a tenant's subscription to a pending/inactive state with plan entitlements."""
    # Resolve plan details
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Subscription plan '{plan_id}' not found.")
        
    # Check if subscription already exists for this tenant
    db_sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    
    if db_sub:
        db_sub.plan_id = plan.id
        db_sub.status = SubscriptionStatus.INACTIVE # requires payment to activate
    else:
        db_sub = Subscription(
            tenant_id=tenant_id,
            plan_id=plan.id,
            status=SubscriptionStatus.INACTIVE
        )
        db.add(db_sub)
        
    try:
        db.commit()
        db.refresh(db_sub)
        return db_sub
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving subscription: {str(e)}")
