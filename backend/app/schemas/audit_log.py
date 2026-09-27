from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Dict, Any

class AuditLogBase(BaseModel):
    payment_request_id: str
    event_type: str
    detail_json: Dict[str, Any]
    actor: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
