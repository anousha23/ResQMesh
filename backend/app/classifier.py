"""
Voice Transcript -> Streamlined Tactical Disaster Incident JSON
---------------------------------------------------------------
Offline rule-based keyword & pattern classifier. No internet or external ML model
dependency required. Converts raw speech-to-text (e.g. offline Whisper) output
and edge device coordinates into a clean, actionable incident schema optimized
strictly for rescue teams and tactical dashboards.

Usage:
    from incident_classifier import classify_transcript
    incident = classify_transcript(
        "there's fire everywhere, we're trapped on the second floor, two of us can't walk",
        lat=12.9698, lon=79.1559, landmark_description="near old library"
    )
    print(json.dumps(incident, indent=2))
"""

import re
import json
import uuid
import socket
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Network configuration (Laptop A -> Laptop B)
# ---------------------------------------------------------------------------
RECEIVER_HOST = "192.168.137.1"   # Laptop B (Windows hotspot host) IP
RECEIVER_PORT = 8000
SEND_TIMEOUT_SECONDS = 5


def send_incident(data: dict, host: str = RECEIVER_HOST, port: int = RECEIVER_PORT) -> bool:
    """
    Send a classified incident dict as JSON to the receiving laptop (Laptop B).
    Returns True if the send succeeded, False otherwise. Never raises -
    a failed network send should not crash a field-deployed classifier.
    """
    try:
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.settimeout(SEND_TIMEOUT_SECONDS)
        client.connect((host, port))
        client.sendall(json.dumps(data).encode("utf-8"))
        client.close()
        print(f"[send_incident] Sent incident {data.get('incident_id')} to {host}:{port}")
        return True
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        print(f"[send_incident] Failed to send incident to {host}:{port} -> {e}")
        return False

# ---------------------------------------------------------------------------
# Keyword Banks & Pattern Specifications
# Fully offline, rule-based, deterministic NLP matching engine
# ---------------------------------------------------------------------------

INCIDENT_TYPE_KEYWORDS = {
    "fire": [
        "fire", "burning", "flames", "smoke", "ablaze", "on fire", "caught fire",
        "inferno", "blaze", "wildfire", "house fire", "structure fire"
    ],
    "flood": [
        "flood", "flooding", "water rising", "drowning", "submerged", "under water",
        "overflowing", "torrential", "flash flood", "water entering"
    ],
    "earthquake": [
        "earthquake", "tremor", "shaking", "quake", "aftershock", "ground shaking"
    ],
    "building_collapse": [
        "collapsed", "collapse", "building fell", "roof caved", "rubble",
        "structure collapse", "walls fell", "caved in", "debris", "structure failure"
    ],
    "medical_emergency": [
        "heart attack", "not breathing", "unconscious", "bleeding heavily",
        "seizure", "medical emergency", "passed out", "cardiac", "stroke",
        "head injury", "severe injury", "bleeding profusely", "no pulse"
    ],
    "trapped_person": [
        "trapped", "stuck", "can't move", "can't get out", "pinned",
        "blocked in", "cannot exit", "locked in", "unable to leave", "can't escape"
    ],
    "gas_leak": [
        "gas leak", "smell gas", "gas smell", "propane", "methane", "gasoline leak"
    ],
    "explosion": [
        "explosion", "explode", "blast", "bomb", "detonation", "blew up"
    ],
    "landslide": [
        "landslide", "mudslide", "hillside collapsed", "rockslide", "earthslide"
    ],
    "electrical_hazard": [
        "electrocuted", "live wire", "sparking", "electric shock", "short circuit",
        "downed power line", "high voltage"
    ],
    "chemical_spill": [
        "chemical spill", "toxic", "fumes", "poison gas", "hazardous material",
        "acid spill", "chemical leak"
    ],
    "active_threat": [
        "shooter", "attacker", "gun", "weapon", "hostage", "active shooter", "shots fired"
    ],
}

HAZARD_KEYWORDS = {
    "fire": ["fire", "flames", "burning", "ablaze", "inferno", "blaze"],
    "smoke": ["smoke", "heavy smoke", "fumes", "suffocating smoke"],
    "collapse_risk": [
        "cracking", "about to collapse", "unstable", "shaking", "roof caved",
        "walls leaning", "debris falling", "structure caved"
    ],
    "gas_leak": ["gas leak", "smell gas", "gas odor", "propane smell"],
    "electrical": ["live wire", "sparking", "electric shock", "downed line", "exposed wire"],
    "chemical": ["chemical", "toxic", "poisonous", "hazard fumes"],
    "flood": [
        "water rising", "flooded", "waist deep", "knee deep", "chest deep",
        "submerged", "flash flood"
    ],
}

SEVERITY_ESCALATORS = [
    r"can'?t breathe", r"cannot breathe", r"dying", r"unconscious", r"bleeding heavily",
    r"bleeding profusely", r"not moving", r"no pulse", r"trapped under", r"collapsed",
    r"explosion", r"on fire", r"infant", r"baby", r"children trapped", r"head injury",
    r"severe pain", r"gasping for air", r"active shooter", r"shots fired", r"hostage",
    r"toxic fumes", r"poison gas"
]

NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20
}

# Regex pattern definitions
FLOOR_PATTERN = re.compile(
    r"\b(?:\d+(?:st|nd|rd|th)?\s*(?:fl|floor|level|storey|story)|ground floor|first floor|second floor|third floor|fourth floor|fifth floor|basement|attic|roof|rooftop|top floor|level\s*\d+|floor\s*\d+)\b",
    re.IGNORECASE,
)

PEOPLE_COUNT_PATTERN = re.compile(
    r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty)\s+(?:people|persons|of us|victims|individuals|men|women|children|kids)\b|\b(?:family|group|team)\s+of\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b",
    re.IGNORECASE,
)

INJURED_COUNT_PATTERN = re.compile(
    r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:injured|hurt|bleeding|wounded)\b",
    re.IGNORECASE,
)

TRAPPED_COUNT_PATTERN = re.compile(
    r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:trapped|stuck|pinned|cannot get out)\b",
    re.IGNORECASE,
)

MOBILITY_PATTERNS = {
    "none_can_walk": [
        re.compile(r"\b(none|no one|nobody|all of us|everyone)\s+(can'?t|cannot|unable to|is unable to)\s+(walk|move|stand|evacuate|get out|leave)\b", re.IGNORECASE),
        re.compile(r"\b(can'?t|cannot|unable to)\s+(walk|move|stand)\s+at all\b", re.IGNORECASE),
        re.compile(r"\b(completely|totally)\s+(immobile|trapped|paralyzed|unable to move)\b", re.IGNORECASE),
        re.compile(r"\bnone of us can (walk|move)\b", re.IGNORECASE),
        re.compile(r"\ball trapped and (can'?t|cannot) move\b", re.IGNORECASE),
    ],
    "some_cannot_walk": [
        re.compile(r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|some|several)\s+(of us\s+)?(can'?t|cannot|unable to|hardly)\s+(walk|move|stand|evacuate)\b", re.IGNORECASE),
        re.compile(r"\b(can'?t|cannot|unable to|hard to|difficult to|un-able to)\s+(walk|move|stand|evacuate)\b", re.IGNORECASE),
        re.compile(r"\b(injured|broken|fractured|hurt)\s+(leg|legs|foot|feet|spine|hip|back|ankle)\b", re.IGNORECASE),
        re.compile(r"\bin a wheelchair|wheelchair bound|on a stretcher\b", re.IGNORECASE),
        re.compile(r"\bone of us (can'?t|cannot) (walk|move)\b", re.IGNORECASE),
    ],
    "all_can_walk": [
        re.compile(r"\b(all of us|everyone|we)\s+(can|are able to)\s+(walk|move|evacuate|run)\b", re.IGNORECASE),
        re.compile(r"\bable to (walk|move|evacuate)\b", re.IGNORECASE),
        re.compile(r"\bwe can walk\b", re.IGNORECASE),
    ],
}

VULNERABLE_GROUP_KEYWORDS = {
    "has_children": ["child", "children", "kid", "kids", "baby", "babies", "infant", "toddler"],
    "has_elderly": ["elderly", "old man", "old woman", "grandmother", "grandfather", "senior", "pensioner"],
    "has_disabled": ["wheelchair", "disabled", "handicap", "blind", "deaf", "handicapped"],
    "has_pregnant": ["pregnant", "expecting", "in labor"],
}


def _contains_any(text, keywords):
    return any(kw in text for kw in keywords)


def _parse_number_str(val_str):
    if not val_str:
        return None
    val_str = val_str.lower().strip()
    if val_str.isdigit():
        return int(val_str)
    return NUMBER_WORDS.get(val_str)


def _extract_people_count(text):
    match = PEOPLE_COUNT_PATTERN.search(text)
    if not match:
        return None
    num_str = match.group(1) or match.group(2)
    return _parse_number_str(num_str)


def _extract_trapped_count(text, general_people_count):
    match = TRAPPED_COUNT_PATTERN.search(text)
    if match:
        return _parse_number_str(match.group(1))
    if any(k in text for k in ["trapped", "stuck", "pinned", "can't get out", "cannot get out"]):
        return general_people_count
    return None


def _extract_injured_count(text):
    match = INJURED_COUNT_PATTERN.search(text)
    if match:
        return _parse_number_str(match.group(1))
    if any(k in text for k in ["injured", "bleeding", "hurt", "broken leg", "head injury"]):
        return 1 if not _extract_people_count(text) else _extract_people_count(text)
    return None


def _extract_floor(text):
    match = FLOOR_PATTERN.search(text)
    if match:
        return match.group(0)
    return None


def _extract_mobility(text):
    for pattern in MOBILITY_PATTERNS["none_can_walk"]:
        if pattern.search(text):
            return "none_can_walk"
    for pattern in MOBILITY_PATTERNS["some_cannot_walk"]:
        if pattern.search(text):
            return "some_cannot_walk"
    for pattern in MOBILITY_PATTERNS["all_can_walk"]:
        if pattern.search(text):
            return "all_can_walk"
    return None


def _extract_vulnerable_groups(text):
    return {
        group: _contains_any(text, keywords)
        for group, keywords in VULNERABLE_GROUP_KEYWORDS.items()
    }


def _classify_incident_type(text):
    scores = {}
    for incident_type, keywords in INCIDENT_TYPE_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in text)
        if hits > 0:
            scores[incident_type] = hits

    if not scores:
        return "unknown"

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    return ranked[0][0]


def _detect_hazards(text):
    return {
        hazard_field: _contains_any(text, keywords)
        for hazard_field, keywords in HAZARD_KEYWORDS.items()
    }


def _resource_needs(text, incident_type, hazards, victims):
    needs = {
        "priority_resource": None,
        "needs_medical": False,
        "needs_extraction": False,
        "needs_fire_suppression": False,
        "needs_evacuation_transport": False,
        "needs_water_supply": False,
    }

    # Medical needs
    if (incident_type in ("medical_emergency", "active_threat") or
        victims.get("injured_count") or
        victims.get("unconscious") or
        hazards.get("fire") or
        hazards.get("chemical") or
        "gasping for air" in text):
        needs["needs_medical"] = True

    # Extraction needs
    if (incident_type in ("trapped_person", "building_collapse", "landslide") or
        victims.get("people_trapped") or
        hazards.get("collapse_risk")):
        needs["needs_extraction"] = True

    # Fire suppression needs
    if hazards.get("fire") or incident_type == "fire":
        needs["needs_fire_suppression"] = True
        needs["needs_medical"] = True
        needs["needs_water_supply"] = True

    # Evacuation & Transport needs
    if (incident_type in ("flood", "landslide", "chemical_spill", "active_threat", "gas_leak") or
        hazards.get("flood") or
        hazards.get("chemical") or
        hazards.get("gas_leak") or
        victims.get("mobility_status") in ("none_can_walk", "some_cannot_walk") or
        hazards.get("collapse_risk")):
        needs["needs_evacuation_transport"] = True

    # Priority Resource Selection
    if needs["needs_fire_suppression"]:
        needs["priority_resource"] = "fire_suppression"
    elif needs["needs_extraction"]:
        needs["priority_resource"] = "extraction"
    elif needs["needs_medical"] and (victims.get("unconscious") or incident_type == "medical_emergency"):
        needs["priority_resource"] = "medical"
    elif needs["needs_evacuation_transport"]:
        needs["priority_resource"] = "evacuation_transport"
    elif needs["needs_medical"]:
        needs["priority_resource"] = "medical"
    elif needs["needs_water_supply"]:
        needs["priority_resource"] = "water_supply"
    else:
        active = [k.replace("needs_", "") for k, v in needs.items() if v is True and k != "priority_resource"]
        needs["priority_resource"] = active[0] if active else "general_response"

    return needs


def classify_transcript(transcript, lat=None, lon=None,
                         landmark_description=None, device_id=None,
                         relay_node_id=None, hop_count=None,
                         battery_level_pct=None, stt_confidence=None,
                         gps_accuracy_meters=None):
    """
    Convert a raw voice transcript into a streamlined tactical disaster incident report.
    Keeps strictly essential parameters required by rescue teams for fast decision-making.
    """
    if not transcript or not isinstance(transcript, str):
        text = ""
    else:
        text = transcript.lower().strip()

    incident_type = _classify_incident_type(text)
    hazards = _detect_hazards(text)
    people_count = _extract_people_count(text)
    trapped_count = _extract_trapped_count(text, people_count)
    injured_count = _extract_injured_count(text)
    mobility_status = _extract_mobility(text)
    floor = _extract_floor(text)
    vulnerable_groups = _extract_vulnerable_groups(text)

    victims = {
        "people_affected": people_count,
        "people_trapped": trapped_count,
        "injured_count": injured_count,
        "unconscious": True if "unconscious" in text or "passed out" in text or "no pulse" in text else False,
        "mobility_status": mobility_status,
        "vulnerable_groups": vulnerable_groups,
    }

    resource_needs = _resource_needs(text, incident_type, hazards, victims)

    incident = {
        "incident_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "incident_type": incident_type,
        "raw_transcript": transcript,
        "location": {
            "latitude": lat,
            "longitude": lon,
            "floor_level": floor,
            "landmark": landmark_description,
        },
        "victims": victims,
        "hazards": hazards,
        "resource_needs": resource_needs,
        "status": "new"
    }

    return incident


if __name__ == "__main__":
    sample = "there's fire everywhere, we're trapped on the second floor, two of us can't walk"
    result = classify_transcript(
        sample,
        lat=12.9698, lon=79.1559,
        landmark_description="near the old library building"
    )
    print(json.dumps(result, indent=2))
