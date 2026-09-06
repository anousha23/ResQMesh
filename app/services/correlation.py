"""
Correlation & Fusion service for incident matching.
Determines whether a new event matches an existing active incident based on spatial, temporal, and type compatibility.
"""

import math
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.config import (
    COMPATIBLE_EVENT_TYPES,
    CORRELATION_MAX_DISTANCE_KM,
    CORRELATION_MAX_TIME_DELTA_MINUTES,
)
from app.models.incident import Incident
from app.services.normalization import NormalizedEvent


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def is_type_compatible(event_type: str, incident_type: str) -> bool:
    """
    Checks if event_type is compatible with incident_type according to COMPATIBLE_EVENT_TYPES rules.
    """
    if event_type == incident_type:
        return True

    allowed_types = COMPATIBLE_EVENT_TYPES.get(event_type, set())
    if incident_type in allowed_types:
        return True

    incident_allowed = COMPATIBLE_EVENT_TYPES.get(incident_type, set())
    if event_type in incident_allowed:
        return True

    return False


def find_matching_incident(
    db: Session,
    norm_event: NormalizedEvent,
    classified_type: str,
    max_distance_km: float = CORRELATION_MAX_DISTANCE_KM,
    max_time_delta_minutes: float = CORRELATION_MAX_TIME_DELTA_MINUTES,
) -> Optional[Incident]:
    """
    Searches active (OPEN, DISPATCHED) incidents for a spatial, temporal, and type match.
    Returns the best matching Incident, or None if no match is found.
    """
    active_incidents: List[Incident] = (
        db.query(Incident)
        .filter(Incident.status.in_(["OPEN", "DISPATCHED"]))
        .all()
    )

    best_incident: Optional[Incident] = None
    best_score = float("inf")

    event_dt = norm_event.timestamp
    if event_dt.tzinfo is None:
        event_dt = event_dt.replace(tzinfo=timezone.utc)

    for incident in active_incidents:
        # 1. Type compatibility
        if not is_type_compatible(classified_type, incident.incident_type):
            continue

        # 2. Temporal proximity check
        inc_dt = incident.updated_at or incident.created_at
        if inc_dt.tzinfo is None:
            inc_dt = inc_dt.replace(tzinfo=timezone.utc)

        time_delta_minutes = abs((event_dt - inc_dt).total_seconds()) / 60.0
        if time_delta_minutes > max_time_delta_minutes:
            continue

        # 3. Spatial proximity check
        if norm_event.latitude is not None and norm_event.longitude is not None:
            if incident.latitude is not None and incident.longitude is not None:
                dist_km = haversine_distance_km(
                    norm_event.latitude,
                    norm_event.longitude,
                    incident.latitude,
                    incident.longitude,
                )
                if dist_km > max_distance_km:
                    continue
            else:
                dist_km = 0.0
        else:
            dist_km = 0.0

        # Weighted score (lower distance and lower time delta preferred)
        score = dist_km + (time_delta_minutes / 60.0)
        if score < best_score:
            best_score = score
            best_incident = incident

    return best_incident
