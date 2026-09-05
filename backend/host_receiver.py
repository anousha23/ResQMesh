#!/usr/bin/env python3
"""
ResQMesh Offline LAN Host Receiver
-----------------------------------
Run this script on the Host Laptop (Laptop B) connected to the local offline LAN/Hotspot network.
Zero external dependencies required (uses built-in Python standard library).

Usage on Host Laptop:
    python host_receiver.py [--port 8000]

Functions:
    1. Automatically detects and displays Host Laptop's LAN IP address.
    2. Listens for incoming HTTP POST /receive_incident JSON reports from ResQMesh client laptops/devices.
    3. Prints formatted incident details to stdout in real-time.
    4. Saves received incidents to 'received_incidents.json'.
"""

import os
import sys
import json
import socket
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

DEFAULT_PORT = 8000
OUTPUT_FILE = "received_incidents.json"


def get_lan_ip():
    """Discover local IP address on active LAN/Wi-Fi interface."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually connect externally, used to query default routing interface
        s.connect(('10.255.255.255', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


class IncidentReceiverHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Clean terminal logging format
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} - {args[1]}")

    def do_GET(self):
        if self.path in ("/", "/health", "/status"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "status": "online",
                "role": "ResQMesh LAN Host Receiver",
                "lan_ip": get_lan_ip(),
                "time": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_error(404, "Endpoint not found")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            payload = json.loads(post_data.decode("utf-8"))
            sender_ip = self.client_address[0]
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            print("\n" + "=" * 70)
            print(f"🚨 [INCIDENT RECEIVED OVER LAN] From Device IP: {sender_ip} at {timestamp}")
            print("=" * 70)
            print(f"📌 Incident ID   : {payload.get('incident_id')}")
            print(f"🏷️  Incident Type : {payload.get('incident_type', '').upper()}")
            print(f"🗣️  Transcript    : \"{payload.get('raw_transcript')}\"")
            
            loc = payload.get("location", {})
            print(f"📍 Location      : Floor: {loc.get('floor_level') or 'Ground'}, Landmark: {loc.get('landmark') or 'N/A'}")
            
            vic = payload.get("victims", {})
            print(f"👥 Victims       : Affected: {vic.get('people_affected') or 1}, Trapped: {vic.get('people_trapped') or 0}, Mobility: {vic.get('mobility_status') or 'Normal'}")
            
            res = payload.get("resource_needs", {})
            print(f"🚑 Priority Req  : {res.get('priority_resource', '').upper()}")
            print("=" * 70)
            print("FULL RECEIVED JSON PAYLOAD:")
            print(json.dumps(payload, indent=2))
            print("=" * 70 + "\n")

            # Append to received incidents file
            saved_incidents = []
            if os.path.exists(OUTPUT_FILE):
                try:
                    with open(OUTPUT_FILE, "r") as f:
                        saved_incidents = json.load(f)
                except Exception:
                    saved_incidents = []

            payload["_lan_metadata"] = {
                "received_at": datetime.now().isoformat(),
                "sender_ip": sender_ip
            }
            saved_incidents.append(payload)

            with open(OUTPUT_FILE, "w") as f:
                json.dump(saved_incidents, f, indent=2)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            ack = {
                "status": "success",
                "message": "Incident JSON received and saved by Host Node",
                "incident_id": payload.get("incident_id")
            }
            self.wfile.write(json.dumps(ack).encode("utf-8"))

        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON format"}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))


def run_server(port=DEFAULT_PORT):
    host_ip = get_lan_ip()
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, IncidentReceiverHandler)

    print("\n" + "★" * 70)
    print("      ResQMesh Offline LAN Host Receiver Node")
    print("★" * 70)
    print(f"  • Host Laptop LAN IP Address : {host_ip}")
    print(f"  • Server Listening Port      : {port}")
    print(f"  • Receiver Endpoint URL      : http://{host_ip}:{port}/receive_incident")
    print(f"  • Output Incident Storage    : {os.path.abspath(OUTPUT_FILE)}")
    print("★" * 70)
    print("  Ready to receive offline emergency incident JSON payloads over LAN.")
    print("  Press Ctrl+C to stop the host server.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[HOST RECEIVER] Stopping server.")
        httpd.server_close()


if __name__ == "__main__":
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
