#!/usr/bin/env python3
"""
ResQMesh Socket Incident Sender
-------------------------------
Classifies raw transcript using incident_classifier.py and transmits
the resulting JSON report directly to Laptop B over raw TCP socket.

Usage:
    python3 sender.py <LAPTOP_B_IP> ["transcript message"]

Example:
    python3 sender.py 192.168.137.1 "Fire in building, trapped on 2nd floor, two can't walk"
"""

import sys
import json
import socket
from incident_classifier import classify_transcript

if len(sys.argv) < 2:
    print("\nUsage: python3 sender.py <LAPTOP_B_IP> [\"transcript message\"]")
    print("Example: python3 sender.py 192.168.137.1 \"Fire on 2nd floor, trapped\"\n")
    sys.exit(1)

host = sys.argv[1]
port = 8000

transcript = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Fire in building, two trapped on 2nd floor, one injured can't walk"

print("\n1. Classifying transcript using incident_classifier.py...")
print(f"   Input: \"{transcript}\"\n")

# Run incident classifier
incident_json = classify_transcript(
    transcript,
    lat=12.9716,
    lon=79.1594,
    landmark_description="Voice SOS Emergency"
)

print("2. Generated Incident JSON Payload:")
print(json.dumps(incident_json, indent=2))

print(f"\n3. Connecting over TCP Socket to Laptop B ({host}:{port})...")
try:
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.settimeout(5)
    client.connect((host, port))
    client.sendall(json.dumps(incident_json).encode("utf-8"))
    client.close()
    print("\n✅ SUCCESS: Sent classified incident JSON to Laptop B!")
except Exception as err:
    print(f"\n❌ Socket Transmission Error: {err}")
