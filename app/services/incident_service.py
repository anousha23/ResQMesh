"""
Orchestration service for Phase 2 event processing pipeline.
Pipeline steps:
1. Normalize incoming event
2. Classify event type
3. Check for related existing incidents (Correlation/Fusion)
4. Create new incident OR attach event to existing incident
5. Calculate/Update severity, confidence, people affected, and timestamps
6. Persist Incident and IncidentEvent relationship in database
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Tuple
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.services.classifier import classify_event
from app.services.confidence import calculate_incident_confidence
from app.services.correlation import find_matching_incident
from app.services.normalization import normalize_event
from app.services.severity import calculate_incident_severity


TYPE_PRIORITY = {
    "PERSON_DETECTED": 1,
    "MANUAL_REPORT": 1,
    "SMOKE_DETECTED": 2,
    "BLOCKED_ROAD": 2,
    "FIRE_DETECTED": 3,
    "COLLAPSED_STRUCTURE": 4,
    "FLOOD": 4,
    "SOS": 5,
    "TRAPPED_PERSON": 6,
}


def extract_people_affected(data: Dict) -> int:
    """Extracts people affected integer count from event payload if available."""
    if not isinstance(data, dict):
        return 0
    # Check victims nested dict
    victims = data.get("victims")
    if isinstance(victims, dict):
        for k in ("people_affected", "people_trapped", "injured_count"):
            val = victims.get(k)
            if isinstance(val, int) and val > 0:
                return val
            if isinstance(val, str) and val.isdigit():
                return int(val)

    # Check top-level keys
    for key in ("count", "people_affected", "people", "num_people"):
        val = data.get(key)
        if isinstance(val, int) and val > 0:
            return val
        if isinstance(val, str) and val.isdigit():
            return int(val)
    return 0


def process_event_pipeline(db: Session, db_event: Event) -> Tuple[Incident, str]:
    """
    Processes a newly stored Event through the Phase 2 intelligence pipeline.
    Returns a tuple of (Incident, action) where action is 'CREATED' or 'ATTACHED'.
    """
    # 1. Normalize
    norm_event = normalize_event(db_event)

    # 2. Classify
    classified_type = classify_event(norm_event.event_type, norm_event.data)

    # Extract people affected from payload if present
    evt_people = extract_people_affected(norm_event.data or {})

    # Timestamp for incident creation/update
    event_dt = norm_event.timestamp
    if event_dt.tzinfo is None:
        event_dt = event_dt.replace(tzinfo=timezone.utc)

    # 3. Check for matching existing active incident
    existing_incident = find_matching_incident(db, norm_event, classified_type)

    if existing_incident:
        # Attach event to existing incident
        action = "ATTACHED"
        incident = existing_incident

        # Create relationship link
        link = IncidentEvent(incident_id=incident.incident_id, event_id=db_event.event_id)
        db.add(link)
        db.flush()

        # Gather all supporting events for recalculating metrics
        supporting_events = list(incident.events)
        if db_event not in supporting_events:
            supporting_events.append(db_event)

        # Upgrade incident_type if new event has higher priority (e.g. PERSON_DETECTED -> TRAPPED_PERSON)
        curr_prio = TYPE_PRIORITY.get(incident.incident_type.upper(), 0)
        new_prio = TYPE_PRIORITY.get(classified_type.upper(), 0)
        if new_prio > curr_prio:
            incident.incident_type = classified_type

        # Update people_affected if new event provides better information
        if evt_people > 0:
            if incident.people_affected is None or evt_people > incident.people_affected:
                incident.people_affected = evt_people

        # Update coordinates if existing incident lacks location and new event has it
        if incident.latitude is None and norm_event.latitude is not None:
            incident.latitude = norm_event.latitude
            incident.longitude = norm_event.longitude

        # Recalculate confidence and severity
        incident.confidence = calculate_incident_confidence(supporting_events)
        incident.severity = calculate_incident_severity(
            supporting_events, incident.incident_type, incident.people_affected
        )
        incident.updated_at = event_dt

        db.commit()
        db.refresh(incident)

    else:
        # Create new incident
        action = "CREATED"
        new_id = f"INC-{uuid.uuid4().hex[:6].upper()}"

        people = evt_people if evt_people > 0 else None

        # Build initial event list
        initial_events = [db_event]

        # Calculate initial confidence and severity
        conf = calculate_incident_confidence(initial_events)
        sev = calculate_incident_severity(initial_events, classified_type, people)

        incident = Incident(
            incident_id=new_id,
            incident_type=classified_type,
            severity=sev,
            status="OPEN",
            latitude=norm_event.latitude,
            longitude=norm_event.longitude,
            people_affected=people,
            confidence=conf,
            created_at=event_dt,
            updated_at=event_dt,
        )
        db.add(incident)
        db.flush()

        # Create link table record
        link = IncidentEvent(incident_id=new_id, event_id=db_event.event_id)
        db.add(link)

        db.commit()
        db.refresh(incident)

    return incident, action
