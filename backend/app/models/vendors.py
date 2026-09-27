from datetime import datetime, UTC
from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base
import uuid

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    address_zcash = Column(String, nullable=False)
    category = Column(String, nullable=False)
    risk_tier = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
