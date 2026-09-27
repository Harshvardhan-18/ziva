from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class PaymentRequestBase(BaseModel):
    agent_id: str
    vendor_id: str
    amount_usd: float
    amount_zat: int
    quote_amount_usd: Optional[float] = None
    tolerance_pct: float = 0.0
    payment_date: datetime

class PaymentRequestCreate(PaymentRequestBase):
    pass

class PaymentRequestResponse(PaymentRequestBase):
    id: str
    status: str
    policy_fail_reason: Optional[str] = None
    jev_anomaly_noul: Optional[float] = None   # Noul: 0.0–1.0 probability
    jev_risk_score: Optional[float] = None      # Score: 0.0–4.0 (5 levels)
    jev_route: Optional[str] = None
    jev_confidence: Optional[float] = None
    txid: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

