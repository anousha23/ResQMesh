"""
Deterministic Severity Engine for ResQMesh Incidents.
Calculates incident severity level (LOW, MEDIUM, HIGH, CRITICAL) based on event types,
combination of evidence, vulnerable groups, unconscious status, and people affected.
"""

from typing import List, Optional
from app.config import (
    EVENT_TYPE_BLOCKED_ROAD,
    EVENT_TYPE_COLLAPSED_STRUCTURE,
    EVENT_TYPE_FIRE_DETECTED,
    EVENT_TYPE_FLOOD,
    EVENT_TYPE_MANUAL_REPORT,
    EVENT_TYPE_PERSON_DETECTED,
    EVENT_TYPE_SMOKE_DETECTED,
    EVENT_TYPE_SOS,
    EVENT_TYPE_TRAPPED_PERSON,
)
from app.models.event import Event

SEVERITY_LOW = "LOW"
SEVERITY_MEDIUM = "MEDIUM"
SEVERITY_HIGH = "HIGH"
SEVERITY_CRITICAL = "CRITICAL"


def calculate_incident_severity(
    events: List[Event],
    incident_type: str,
    people_affected: Optional[int] = None,
) -> str:
    """
    Calculates incident severity based on deterministic rules.

    Rules:
    1. CRITICAL:
       - Combination of FIRE_DETECTED and (TRAPPED_PERSON, SOS, COLLAPSED_STRUCTURE, or FLOOD)
       - Combination of TRAPPED_PERSON and SOS
       - High hazard (FLOOD, TRAPPED_PERSON, COLLAPSED_STRUCTURE, FIRE_DETECTED, SOS) combined with vulnerable groups (has_children, has_elderly, etc.) or unconscious victims
       - High hazard with people_affected >= 3
    2. HIGH:
       - Incident type or any event is TRAPPED_PERSON, SOS, COLLAPSED_STRUCTURE, FIRE_DETECTED, or FLOOD
    3. MEDIUM:
       - Incident type or any event is SMOKE_DETECTED or BLOCKED_ROAD
       - PERSON_DETECTED with people_affected > 1
    4. LOW:
       - Standard PERSON_DETECTED or minor informational report.
    """
    all_event_types = set()
    has_vulnerable_group = False
    has_unconscious = False

    for e in events:
        if e.event_type:
            all_event_types.add(e.event_type.upper())

        # Inspect nested payload data for vulnerable_groups and unconscious flags
        if isinstance(e.data, dict):
            victims = e.data.get("victims")
            if isinstance(victims, dict):
                vg = victims.get("vulnerable_groups")
                if isinstance(vg, dict) and any(bool(v) for v in vg.values()):
                    has_vulnerable_group = True
                if victims.get("unconscious") is True:
                    has_unconscious = True

    all_event_types.add((incident_type or "").upper())

    has_fire = EVENT_TYPE_FIRE_DETECTED in all_event_types
    has_trapped = EVENT_TYPE_TRAPPED_PERSON in all_event_types
    has_sos = EVENT_TYPE_SOS in all_event_types
    has_collapse = EVENT_TYPE_COLLAPSED_STRUCTURE in all_event_types
    has_flood = EVENT_TYPE_FLOOD in all_event_types
    has_smoke = EVENT_TYPE_SMOKE_DETECTED in all_event_types
    has_road_blocked = EVENT_TYPE_BLOCKED_ROAD in all_event_types

    count_people = people_affected or 0
    has_high_hazard = has_fire or has_trapped or has_sos or has_collapse or has_flood
    has_vulnerable = has_vulnerable_group or has_unconscious

    # Rule 1: CRITICAL
    if has_fire and (has_trapped or has_sos or has_collapse or has_flood):
        return SEVERITY_CRITICAL

    if has_trapped and has_sos:
        return SEVERITY_CRITICAL

    if has_high_hazard and has_vulnerable:
        return SEVERITY_CRITICAL

    if (has_trapped or has_collapse or has_sos or has_flood) and count_people >= 3:
        return SEVERITY_CRITICAL

    # Rule 2: HIGH
    if has_high_hazard:
        return SEVERITY_HIGH

    # Rule 3: MEDIUM
    if has_smoke or has_road_blocked:
        return SEVERITY_MEDIUM

    if count_people > 1:
        return SEVERITY_MEDIUM

    # Rule 4: LOW
    return SEVERITY_LOW
