from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.event import EventResponse


class IncidentResponse(BaseModel):
    incident_id: str
    incident_type: str
    severity: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    people_affected: Optional[int] = None
    confidence: Optional[float] = None
    distance_from_base_km: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    supporting_events: List[EventResponse] = []

    model_config = ConfigDict(from_attributes=True)


class EventIngestResponse(EventResponse):
    incident_id: str
    incident_action: str  # "CREATED" or "ATTACHED"

    model_config = ConfigDict(from_attributes=True)