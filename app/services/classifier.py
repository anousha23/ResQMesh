"""
Classification service for events.
Uses deterministic rules and keyword matching to classify raw event types into canonical categories.
"""

import logging
from typing import Any, Dict, Optional
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

logger = logging.getLogger(__name__)

KEYWORD_MAPPINGS = [
    (
        {"trapped", "stuck", "cannot get out", "can't get out", "people inside", "trapped inside"},
        EVENT_TYPE_TRAPPED_PERSON,
    ),
    (
        {"collapsed", "rubble", "building down", "structure collapse", "building collapsed"},
        EVENT_TYPE_COLLAPSED_STRUCTURE,
    ),
    (
        {"fire", "flames", "burning", "blaze"},
        EVENT_TYPE_FIRE_DETECTED,
    ),
    (
        {"smoke", "heavy smoke"},
        EVENT_TYPE_SMOKE_DETECTED,
    ),
    (
        {"flood", "flooding", "water rising", "drowning", "dying"},
        EVENT_TYPE_FLOOD,
    ),
    (
        {"blocked road", "road blocked", "debris on road", "landslide"},
        EVENT_TYPE_BLOCKED_ROAD,
    ),
    (
        {"sos", "help", "emergency", "mayday", "distress"},
        EVENT_TYPE_SOS,
    ),
]


def classify_event(event_type: str, data: Optional[Dict[str, Any]] = None) -> str:
    """
    Classifies an event type using deterministic rule mapping and keyword inspection.
    Scans data.raw_transcript and related text fields.
    """
    raw_type = (event_type or "").upper().strip()
    payload = data or {}

    # Check for direct alias / standard types
    if raw_type in ("SOS_ALERT", "SOS_SIGNAL", "SOS", "CIVILIAN_SOS"):
        base_class = EVENT_TYPE_SOS
    elif raw_type in ("PERSON_DETECTED", "PERSON"):
        base_class = EVENT_TYPE_PERSON_DETECTED
    elif raw_type in ("FIRE_DETECTED", "FIRE"):
        base_class = EVENT_TYPE_FIRE_DETECTED
    elif raw_type in ("SMOKE_DETECTED", "SMOKE"):
        base_class = EVENT_TYPE_SMOKE_DETECTED
    elif raw_type in ("TRAPPED_PERSON", "TRAPPED"):
        base_class = EVENT_TYPE_TRAPPED_PERSON
    elif raw_type in ("FLOOD", "FLOODING"):
        base_class = EVENT_TYPE_FLOOD
    elif raw_type in ("BLOCKED_ROAD", "ROAD_BLOCKED"):
        base_class = EVENT_TYPE_BLOCKED_ROAD
    elif raw_type in ("COLLAPSED_STRUCTURE", "COLLAPSE"):
        base_class = EVENT_TYPE_COLLAPSED_STRUCTURE
    elif raw_type in ("MANUAL_REPORT", "VOICE_REPORT", "TEXT_REPORT"):
        base_class = EVENT_TYPE_MANUAL_REPORT
    else:
        base_class = raw_type

    # Inspect raw_transcript, message, text, transcript in payload for keyword classification
    text_content = ""
    for key in ("raw_transcript", "message", "text", "transcript", "notes", "description"):
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            text_content += " " + val.lower()

    if text_content:
        for keywords, mapped_type in KEYWORD_MAPPINGS:
            if any(kw in text_content for kw in keywords):
                print(f"[CLASSIFIER] Keyword match found in transcript/text ('{text_content.strip()}') -> {mapped_type}")
                logger.info(f"Classifier keyword match in transcript: {mapped_type}")
                return mapped_type

    return base_class
