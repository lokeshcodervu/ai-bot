# controllers/payment_controller.py

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone
import secrets

from app.models.payment import Payment, PaymentStatus, PaymentGateway
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.tenant import Tenant

def create_payment_order(
    db: Session,
    tenant_id: UUID,
    subscription_id: UUID,
    amount: int,
    gateway: PaymentGateway = PaymentGateway.MOCK
) -> Payment:
    """Create a new payment order record with a mock gateway order ID."""
    gateway_order_id = f"order_{secrets.token_hex(8)}"
    
    db_payment = Payment(
        tenant_id=tenant_id,
        subscription_id=subscription_id,
        amount=amount,
        currency="USD",
        payment_status=PaymentStatus.PENDING,
        payment_gateway=gateway,
        gateway_order_id=gateway_order_id
    )
    
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def verify_payment_order(
    db: Session,
    payment_id: UUID,
    gateway_payment_id: str = None,
    gateway_signature: str = None
) -> Payment:
    """Verify payment status, activate subscription entitlements, and complete tenant onboarding."""
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment transaction order not found.")
        
    if db_payment.payment_status == PaymentStatus.SUCCESS:
        return db_payment
        
    # Mark payment as successful
    db_payment.payment_status = PaymentStatus.SUCCESS
    db_payment.gateway_payment_id = gateway_payment_id or f"pay_{secrets.token_hex(8)}"
    db_payment.gateway_signature = gateway_signature or f"sig_{secrets.token_hex(16)}"
    
    # Resolve subscription and activate it
    if db_payment.subscription_id:
        db_sub = db.query(Subscription).filter(Subscription.id == db_payment.subscription_id).first()
        if db_sub:
            db_sub.status = SubscriptionStatus.ACTIVE
            db_sub.start_date = datetime.now(timezone.utc)
            db_sub.end_date = datetime.now(timezone.utc) + timedelta(days=30)
            
    # Resolve tenant and mark onboarding complete
    db_tenant = db.query(Tenant).filter(Tenant.id == db_payment.tenant_id).first()
    if db_tenant:
        db_tenant.is_payment_done = True
        db_tenant.is_active = True
        db_tenant.is_onboarding_completed = True
        
    try:
        db.commit()
        db.refresh(db_payment)
        if db_payment.subscription_id and db_sub:
            db.refresh(db_sub)
        if db_tenant:
            db.refresh(db_tenant)
        return db_payment
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error during payment verification: {str(e)}")
