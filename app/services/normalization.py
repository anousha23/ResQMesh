"""
Normalization service for incoming events.
Separates payload parsing/normalization logic from API routes and edge adapters.
Extracts nested fields from raw edge payloads (e.g., Whisper voice reports and YOLO detections).
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional
from app.models.event import Event


@dataclass
class NormalizedEvent:
    event_id: str
    device_id: str
    timestamp: datetime
    latitude: Optional[float]
    longitude: Optional[float]
    event_type: str
    confidence: Optional[float]
    raw_transcript: Optional[str] = None
    people_affected: Optional[int] = None
    people_trapped: Optional[int] = None
    vulnerable_groups: Dict[str, bool] = field(default_factory=dict)
    unconscious: bool = False
    data: Optional[Dict[str, Any]] = None


def normalize_event(db_event: Event) -> NormalizedEvent:
    """
    Normalizes a stored Event DB model into a standard NormalizedEvent structure,
    properly extracting nested fields from edge payload formats (e.g. data.location,
    data.victims, data.raw_transcript, data.incident_type).
    """
    data = db_event.data or {}
    if not isinstance(data, dict):
        data = {}

    # 1. Event Type: Prefer data.incident_type over top-level event_type
    raw_type = data.get("incident_type") or db_event.event_type or "UNKNOWN"
    event_type = str(raw_type).upper().strip()

    # 2. Location: Prefer nested data.location.latitude/longitude over top-level lat/lon
    loc_obj = data.get("location")
    lat = None
    lon = None
    if isinstance(loc_obj, dict):
        lat = loc_obj.get("latitude") if loc_obj.get("latitude") is not None else loc_obj.get("lat")
        lon = loc_obj.get("longitude") if loc_obj.get("longitude") is not None else loc_obj.get("lon")

    if lat is None:
        lat = db_event.latitude
    if lon is None:
        lon = db_event.longitude

    # Ensure lat/lon are floats if present
    lat = float(lat) if lat is not None else None
    lon = float(lon) if lon is not None else None

    # 3. Raw Transcript
    raw_transcript = data.get("raw_transcript") or data.get("transcript") or data.get("message")
    if raw_transcript is not None:
        raw_transcript = str(raw_transcript)

    # 4. Victims & Vulnerable Groups
    victims = data.get("victims")
    people_affected = None
    people_trapped = None
    vulnerable_groups = {}
    unconscious = False

    if isinstance(victims, dict):
        pa = victims.get("people_affected")
        pt = victims.get("people_trapped")
        if pa is not None:
            try:
                people_affected = int(pa)
            except (ValueError, TypeError):
                people_affected = None
        if pt is not None:
            try:
                people_trapped = int(pt)
            except (ValueError, TypeError):
                people_trapped = None

        vg = victims.get("vulnerable_groups")
        if isinstance(vg, dict):
            vulnerable_groups = {k: bool(v) for k, v in vg.items()}

        unconscious = bool(victims.get("unconscious", False))

    # Fallback for count in top-level data if victims count is null
    if people_affected is None and "count" in data:
        cnt = data.get("count")
        if isinstance(cnt, int):
            people_affected = cnt
        elif isinstance(cnt, str) and cnt.isdigit():
            people_affected = int(cnt)

    return NormalizedEvent(
        event_id=db_event.event_id,
        device_id=db_event.device_id,
        timestamp=db_event.timestamp,
        latitude=lat,
        longitude=lon,
        event_type=event_type,
        confidence=db_event.confidence,
        raw_transcript=raw_transcript,
        people_affected=people_affected,
        people_trapped=people_trapped,
        vulnerable_groups=vulnerable_groups,
        unconscious=unconscious,
        data=data,
    )
