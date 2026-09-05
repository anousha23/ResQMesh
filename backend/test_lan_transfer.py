#!/usr/bin/env python3
"""
ResQMesh LAN Transmission Test Harness
--------------------------------------
Simulates sending offline incident JSON payloads from Client Laptop A to Host Laptop B over LAN.

Usage:
    python test_lan_transfer.py [--host <HOST_IP>] [--port <PORT>]

Example:
    python test_lan_transfer.py --host 192.168.1.50 --port 8000
"""

import sys
import json
import argparse
import urllib.request
import urllib.error
from incident_classifier import classify_transcript

SAMPLE_TRANSCRIPTS = [
    "Fire in building, two trapped on 2nd floor, one injured can't walk",
    "Flood water rising fast near old bridge, family of four stuck on rooftop",
    "Gas leak detected in basement, smell strong propane fumes",
    "Building wall collapsed after earthquake, 3 people trapped in rubble"
]

def test_lan_send(host_ip, port):
    target_url = f"http://{host_ip}:{port}/receive_incident"
    print(f"\n==================================================")
    print(f"📡 Testing LAN Transmission to Host Node")
    print(f"Target Host Endpoint: {target_url}")
    print(f"==================================================\n")

    # Step 1: Health Check
    health_url = f"http://{host_ip}:{port}/health"
    try:
        req = urllib.request.Request(health_url, method="GET")
        with urllib.request.urlopen(req, timeout=3) as resp:
            health_data = json.loads(resp.read().decode("utf-8"))
            print(f"✅ Host Node Connection OK: {health_data}\n")
    except Exception as err:
        print(f"⚠️  Warning: Host health check on {health_url} failed: {err}")
        print(f"Attempting to transmit JSON directly to {target_url}...\n")

    # Step 2: Classify and Transmit Sample Incidents
    success_count = 0
    for idx, text in enumerate(SAMPLE_TRANSCRIPTS, 1):
        print(f"--- Transmitting Incident #{idx} ---")
        print(f"Transcript: \"{text}\"")
        
        # Generate offline incident report
        incident_json = classify_transcript(
            text,
            lat=12.9716, lon=79.1594,
            landmark_description=f"LAN Test Point #{idx}"
        )

        data_bytes = json.dumps(incident_json).encode("utf-8")
        req = urllib.request.Request(
            target_url,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp_body = json.loads(resp.read().decode("utf-8"))
                print(f"STATUS: {resp.status} OK")
                print(f"HOST ACK: {resp_body}")
                print(f"RESULT: Successfully transferred Incident ID {incident_json['incident_id']} over LAN!\n")
                success_count += 1
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error {e.code}: {e.reason}\n")
        except urllib.error.URLError as e:
            print(f"❌ Network Error: Could not connect to {target_url}. Error: {e.reason}\n")

    print(f"==================================================")
    print(f"📊 LAN Transmission Summary: {success_count}/{len(SAMPLE_TRANSCRIPTS)} Transferred Successfully")
    print(f"==================================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test ResQMesh LAN JSON Transmission")
    parser.add_argument("--host", default="127.0.0.1", help="Host Laptop IP address on LAN (e.g. 192.168.1.50)")
    parser.add_argument("--port", type=int, default=8000, help="Host Receiver Port (default: 8000)")
    args = parser.parse_args()

    test_lan_send(args.host, args.port)
