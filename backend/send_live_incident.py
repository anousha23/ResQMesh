#!/usr/bin/env python3
"""
Send Live Incident JSON to Host Laptop over LAN
------------------------------------------------
Classifies any spoken message or transcript using incident_classifier.py
and sends the resulting JSON directly to Laptop B over LAN.

Usage:
    python send_live_incident.py <HOST_IP> ["your voice transcript here"]

Example:
    python send_live_incident.py 192.168.137.1 "Fire in building, trapped on 2nd floor, two can't walk"
"""

import sys
import json
import urllib.request
import urllib.error
from incident_classifier import classify_transcript

if len(sys.argv) < 2:
    print("\nUsage: python send_live_incident.py <HOST_IP> [\"transcript text\"]")
    print("Example: python send_live_incident.py 192.168.137.1 \"Fire on second floor, two trapped\"\n")
    sys.exit(1)

host_ip = sys.argv[1]
transcript = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Fire in building, two trapped on 2nd floor, one injured can't walk"

print(f"\n1. Classifying transcript using incident_classifier.py...")
print(f"   Transcript: \"{transcript}\"\n")

# Run incident_classifier to generate JSON
incident_json = classify_transcript(
    transcript,
    lat=12.9716,
    lon=79.1594,
    landmark_description="LAN Emergency Report"
)

print("2. Generated JSON Payload:")
print(json.dumps(incident_json, indent=2))

url = f"http://{host_ip}:8000/receive_incident"
print(f"\n3. Sending JSON payload over LAN to Laptop B at {url}...")

try:
    data_bytes = json.dumps(incident_json).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=5) as resp:
        response_body = json.loads(resp.read().decode("utf-8"))
        print("\n✅ SUCCESS! Laptop B received your incident JSON payload!")
        print(f"   Host Response: {response_body}\n")

except urllib.error.URLError as e:
    print(f"\n❌ Network Error: Could not connect to {url}")
    print(f"   Reason: {e.reason}")
    print("   Check: Make sure Laptop B is running 'python host_receiver.py 8000' and firewall allows port 8000.\n")
except Exception as e:
    print(f"\n❌ Error: {e}\n")
