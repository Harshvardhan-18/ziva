from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

class AgentBase(BaseModel):
    name: str
    persona: str
    budget_usd: float
    budget_period: str
    approved_vendors: List[str] = []

class AgentCreate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: str
    budget_spent_usd: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
