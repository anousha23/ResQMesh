from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, model_validator


class LocationSchema(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None


class EventCreate(BaseModel):
    event_id: str
    device_id: str
    timestamp: datetime
    location: Optional[LocationSchema] = None
    event_type: str
    confidence: Optional[float] = None
    data: Optional[dict[str, Any]] = None


class EventResponse(BaseModel):
    event_id: str
    device_id: str
    timestamp: datetime
    location: Optional[LocationSchema] = None
    event_type: str
    confidence: Optional[float] = None
    data: Optional[dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def assemble_location(cls, data: Any) -> Any:
        if hasattr(data, "latitude") or hasattr(data, "longitude"):
            lat = getattr(data, "latitude", None)
            lon = getattr(data, "longitude", None)
            location = None
            if lat is not None or lon is not None:
                location = {"lat": lat, "lon": lon}
            return {
                "event_id": getattr(data, "event_id"),
                "device_id": getattr(data, "device_id"),
                "timestamp": getattr(data, "timestamp"),
                "location": location,
                "event_type": getattr(data, "event_type"),
                "confidence": getattr(data, "confidence"),
                "data": getattr(data, "data"),
                "created_at": getattr(data, "created_at"),
            }
        return data
