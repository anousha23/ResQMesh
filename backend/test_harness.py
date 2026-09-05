"""
Test Harness for Disaster Voice Transcript Classifier
------------------------------------------------------
Batch test harness that reads sample voice transcripts from a text file,
runs each transcript through the classification engine (directly or via REST API),
triggers the WebSocket dispatch stub, and displays formatted JSON incident reports.

Usage:
    python test_harness.py                       # Run in direct function mode
    python test_harness.py --mode api            # Test via HTTP POST requests to running app.py
    python test_harness.py --file custom.txt     # Run custom transcripts file
"""

import sys
import json
import argparse
import requests
from pathlib import Path

from app.classifier import classify_transcript
from app.api.classify import send_to_root_node

DEFAULT_TRANSCRIPTS_FILE = "sample_transcripts.txt"
DEFAULT_API_URL = "http://localhost:8000/classify"


def print_banner(text):
    print("=" * 80)
    print(f" {text}")
    print("=" * 80)


def run_direct_mode(transcripts_path):
    print_banner(f"RUNNING TEST HARNESS IN DIRECT MODE (File: {transcripts_path})")

    with open(transcripts_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    results = []
    for idx, transcript in enumerate(lines, 1):
        print(f"\n--- SAMPLE #{idx} ---")
        print(f"Transcript: \"{transcript}\"")

        incident = classify_transcript(
            transcript=transcript,
            lat=12.9698 + (idx * 0.001),
            lon=79.1559 + (idx * 0.001),
            landmark_description=f"Near Sector {idx} landmark"
        )

        send_to_root_node(incident)

        print("\nGenerated Streamlined Incident JSON Report:")
        print(json.dumps(incident, indent=2))

        results.append({
            "idx": idx,
            "type": incident["incident_type"],
            "severity": incident["severity"]["level"],
            "score": incident["severity"]["score"],
            "priority_resource": incident["resource_needs"]["priority_resource"],
            "mobility": incident["victims"]["mobility_status"],
            "affected_count": incident["victims"]["people_affected"]
        })

    print_summary_table(results)


def run_api_mode(transcripts_path, api_url):
    print_banner(f"RUNNING TEST HARNESS IN API MODE (URL: {api_url})")

    with open(transcripts_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip() and not line.startswith("#")]

    results = []
    for idx, transcript in enumerate(lines, 1):
        print(f"\n--- SAMPLE #{idx} (HTTP POST) ---")
        print(f"Transcript: \"{transcript}\"")

        payload = {
            "transcript": transcript,
            "lat": 12.9698 + (idx * 0.001),
            "lon": 79.1559 + (idx * 0.001),
            "landmark_description": f"Near Sector {idx} landmark"
        }

        try:
            resp = requests.post(api_url, json=payload, timeout=5)
            if resp.status_code == 200:
                incident = resp.json()
                print("HTTP 200 OK - Incident JSON Response:")
                print(json.dumps(incident, indent=2))

                results.append({
                    "idx": idx,
                    "type": incident["incident_type"],
                    "severity": incident["severity"]["level"],
                    "score": incident["severity"]["score"],
                    "priority_resource": incident["resource_needs"]["priority_resource"],
                    "mobility": incident["victims"]["mobility_status"],
                    "affected_count": incident["victims"]["people_affected"]
                })
            else:
                print(f"HTTP Error {resp.status_code}: {resp.text}")
        except requests.exceptions.RequestException as e:
            print(f"Failed to connect to API server at {api_url}: {e}")
            sys.exit(1)

    print_summary_table(results)


def print_summary_table(results):
    print_banner("TACTICAL SUMMARY MATRIX OF CLASSIFIED INCIDENTS")
    header = f"{'#':<3} | {'Incident Type':<18} | {'Severity':<9} | {'Score':<5} | {'Mobility':<17} | {'Priority Resource':<20}"
    print(header)
    print("-" * len(header))
    for r in results:
        t_type = str(r["type"])
        sev = str(r["severity"])
        score = str(r["score"])
        mob = str(r["mobility"])
        p_res = str(r["priority_resource"])
        print(f"{r['idx']:<3} | {t_type:<18} | {sev:<9} | {score:<5} | {mob:<17} | {p_res:<20}")
    print("-" * len(header))


def main():
    parser = argparse.ArgumentParser(description="Test Harness for Disaster Incident Classification")
    parser.add_argument("--file", type=str, default=DEFAULT_TRANSCRIPTS_FILE, help="Path to sample transcripts text file")
    parser.add_argument("--mode", choices=["direct", "api"], default="direct", help="Execution mode: direct python or HTTP API")
    parser.add_argument("--url", type=str, default=DEFAULT_API_URL, help="API Endpoint URL for api mode")
    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"Error: Transcripts file '{args.file}' not found.")
        sys.exit(1)

    if args.mode == "direct":
        run_direct_mode(args.file)
    else:
        run_api_mode(args.file, args.url)


if __name__ == "__main__":
    main()
