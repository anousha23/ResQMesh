#!/usr/bin/env python3
"""
Send Live Incident to ResQMesh Backend (Laptop B) over LAN
------------------------------------------------------------
Classifies a spoken transcript using incident_classifier.py, registers this
device with the backend (if not already registered), then POSTs the incident
as an Event into the real FastAPI backend running on Laptop B.

Usage:
    python send_live_incident.py <HOST_IP> ["your voice transcript here"]

Example:
    python send_live_incident.py 192.168.137.1 "Fire in building, trapped on 2nd floor, two can't walk"
"""

import sys
import json
import uuid
import urllib.request
import urllib.error
from datetime import datetime, timezone

from incident_classifier import classify_transcript

# ---------------------------------------------------------------------------
# Config - adjust DEVICE_ID once per physical device (Laptop A / field unit)
# ---------------------------------------------------------------------------
DEVICE_ID = "laptop-a-001"
DEVICE_TYPE = "laptop"
DEVICE_ROLE = "field_reporter"


def _post_json(url, payload, timeout=5):
    """POST a dict as JSON and return (status_code, parsed_body_or_error_text)."""
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return resp.status, body
    except urllib.error.HTTPError as e:
        # HTTPError still has a body we can read (e.g. 400/404 detail messages)
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"detail": str(e)}
        return e.code, body
    except urllib.error.URLError as e:
        return None, {"detail": f"Network error: {e.reason}"}


def ensure_device_registered(host_ip):
    """Register this device with the backend. Safe to call every run -
    a 400 'already registered' response is treated as success."""
    url = f"http://{host_ip}:8000/devices"
    payload = {
        "device_id": DEVICE_ID,
        "device_type": DEVICE_TYPE,
        "role": DEVICE_ROLE,
        "status": "online",
    }
    status_code, body = _post_json(url, payload)

    if status_code == 201:
        print(f"✅ Device '{DEVICE_ID}' registered with backend.")
        return True
    if status_code == 400:
        # Already registered - this is fine, not an error
        print(f"ℹ️  Device '{DEVICE_ID}' already registered.")
        return True

    print(f"❌ Failed to register device (status={status_code}): {body}")
    return False


def send_incident_event(host_ip, incident_json):
    """Wrap the classified incident into the /events schema and POST it."""
    url = f"http://{host_ip}:8000/events"

    location = None
    lat = incident_json.get("location", {}).get("latitude")
    lon = incident_json.get("location", {}).get("longitude")
    if lat is not None or lon is not None:
        location = {"lat": lat, "lon": lon}

    event_payload = {
        "event_id": incident_json.get("incident_id", str(uuid.uuid4())),
        "device_id": DEVICE_ID,
        "timestamp": incident_json.get(
            "timestamp", datetime.now(timezone.utc).isoformat()
        ),
        "location": location,
        "event_type": incident_json.get("incident_type", "unknown"),
        "confidence": incident_json.get("stt_confidence"),
        "data": incident_json,  # full nested incident (victims, hazards, resource_needs, etc.)
    }

    return _post_json(url, event_payload)


def main():
    if len(sys.argv) < 2:
        print("\nUsage: python send_live_incident.py <HOST_IP> [\"transcript text\"]")
        print("Example: python send_live_incident.py 192.168.137.1 \"Fire on second floor, two trapped\"\n")
        sys.exit(1)

    host_ip = sys.argv[1]
    transcript = (
        " ".join(sys.argv[2:])
        if len(sys.argv) > 2
        else "Fire in building, two trapped on 2nd floor, one injured can't walk"
    )

    print(f"\n1. Classifying transcript using incident_classifier.py...")
    print(f"   Transcript: \"{transcript}\"\n")

    incident_json = classify_transcript(
        transcript,
        lat=12.9716,
        lon=79.1594,
        landmark_description="LAN Emergency Report",
    )

    print("2. Generated Incident JSON:")
    print(json.dumps(incident_json, indent=2))

    print(f"\n3. Ensuring device is registered with backend at {host_ip}:8000...")
    if not ensure_device_registered(host_ip):
        print("   Aborting: could not register device, event will likely fail.\n")
        sys.exit(1)

    print(f"\n4. Sending incident as Event to http://{host_ip}:8000/events ...")
    status_code, body = send_incident_event(host_ip, incident_json)

    if status_code == 201:
        print("\n✅ SUCCESS! Incident stored in ResQMesh backend database.")
        print(f"   Response: {json.dumps(body, indent=2)}\n")
    else:
        print(f"\n❌ Failed to send incident (status={status_code})")
        print(f"   Response: {body}")
        print("   Check: Is app/main.py (FastAPI backend) running on Laptop B on port 8000?\n")


if __name__ == "__main__":
    main()