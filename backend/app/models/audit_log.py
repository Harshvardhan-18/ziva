from datetime import datetime, UTC
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base
import uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_request_id = Column(String, ForeignKey("payment_requests.id"), nullable=False)
    event_type = Column(String, nullable=False)
    detail_json = Column(JSONB, nullable=False)
    actor = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC))
