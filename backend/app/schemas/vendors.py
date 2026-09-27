from pydantic import BaseModel, ConfigDict
from datetime import datetime

class VendorBase(BaseModel):
    name: str
    address_zcash: str
    category: str
    risk_tier: int = 3

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
