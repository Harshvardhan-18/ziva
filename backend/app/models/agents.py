from datetime import datetime, UTC
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base
import uuid

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    persona = Column(String, nullable=False)
    budget_usd = Column(Float, nullable=False)
    budget_spent_usd = Column(Float, default=0.0)
    budget_period = Column(String, nullable=False) # e.g. "monthly"
    approved_vendors = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
