from datetime import datetime, UTC
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from app.database import Base
import uuid

class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    amount_usd = Column(Float, nullable=False)
    amount_zat = Column(Integer, nullable=False)
    quote_amount_usd = Column(Float, nullable=True)
    tolerance_pct = Column(Float, default=0.0)
    payment_date = Column(DateTime, nullable=False)
    
    # pending, policy_failed, jev_approved, jev_escalated, jev_blocked, human_approved, human_rejected, broadcasting, confirmed, failed
    status = Column(String, default="pending", nullable=False)
    policy_fail_reason = Column(String, nullable=True)
    
    # Jev context
    jev_anomaly_noul = Column(Float, nullable=True)   # Noul: 0.0–1.0 probability
    jev_risk_score = Column(Float, nullable=True)      # Score: 0.0–4.0 (5 levels)
    jev_route = Column(String, nullable=True)
    jev_confidence = Column(Float, nullable=True)
    
    txid = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
