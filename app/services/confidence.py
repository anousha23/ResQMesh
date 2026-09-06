"""
Incident confidence calculation engine.
Follows the Source Independence Rule: counts distinct supporting sources (devices)
rather than raw event count, and calculates an explainable confidence score.
"""

from typing import List, Optional
from app.models.event import Event


def calculate_incident_confidence(events: List[Event]) -> Optional[float]:
    """
    Calculates incident confidence score based on supporting events.

    Scoring Logic:
    1. Group supporting events by distinct device_id (Source Independence Rule).
    2. Extract valid non-null event confidences.
       - If non-null confidences exist: base_conf = max(valid_confidences)
       - If all confidences are null: base_conf = 0.60 (default confidence for manual/field reports)
    3. Count distinct supporting sources (devices) N.
    4. For N > 1 distinct sources, add a source agreement boost of 0.10 per additional distinct source.
    5. Cap final incident confidence at 0.99.

    Formula:
      confidence = min(0.99, base_conf + (distinct_sources - 1) * 0.10)
    """
    if not events:
        return None

    # Group events by distinct device_id
    distinct_devices = set(e.device_id for e in events if e.device_id)
    distinct_source_count = max(1, len(distinct_devices))

    # Extract valid non-null event confidences
    valid_confidences = [e.confidence for e in events if e.confidence is not None]

    if valid_confidences:
        base_confidence = max(valid_confidences)
    else:
        # Default baseline confidence for manual/civilian/responder reports with missing confidence
        base_confidence = 0.60

    # Apply distinct source agreement boost
    source_boost = (distinct_source_count - 1) * 0.10
    final_confidence = min(0.99, round(base_confidence + source_boost, 2))

    return final_confidence
