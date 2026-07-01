# models/plan.py

from sqlalchemy import Column, String, Numeric, Integer, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(50), primary_key=True, index=True) # e.g. "basic", "pro", "enterprise"
    name = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    billing_cycle = Column(String(20), nullable=False, default="monthly")
    features = Column(JSON, nullable=False, default=dict)
    max_users = Column(Integer, nullable=False, default=5)
    max_campaigns = Column(Integer, nullable=False, default=10)
    max_monthly_calls = Column(Integer, nullable=False, default=1000)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")

    def __repr__(self):
        return f"<Plan {self.name}>"
