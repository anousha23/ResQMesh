from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DeviceCreate(BaseModel):
    device_id: str
    device_type: str
    role: str
    status: str


class DeviceResponse(BaseModel):
    device_id: str
    device_type: str
    role: str
    status: str
    last_seen: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
