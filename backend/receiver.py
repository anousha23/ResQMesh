#!/usr/bin/env python3
"""
ResQMesh Socket Incident Receiver (Run on Laptop B)
---------------------------------------------------
Listens on TCP port 8000 for incoming classified incident JSON reports
from Laptop A over local network / Wi-Fi Hotspot.

Usage on Laptop B:
    python3 receiver.py
"""

import sys
import json
import socket

HOST = "0.0.0.0"   # Listen on all local network interfaces
PORT = 8000

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((HOST, PORT))
server.listen(5)

print("\n" + "=" * 60)
print(f"🚨 ResQMesh TCP Receiver Server Listening on {HOST}:{PORT}")
print("=" * 60)
print("Waiting for incoming incident JSON payloads from Laptop A...\n")

while True:
    try:
        conn, addr = server.accept()
        print(f"[+] Connected by Laptop A at IP: {addr[0]}")

        data = b""
        while True:
            chunk = conn.recv(4096)
            if not chunk:
                break
            data += chunk

        if data:
            try:
                message = json.loads(data.decode("utf-8"))
                print("\n" + "★" * 60)
                print("🚨 [RECEIVED CLASSIFIED INCIDENT JSON PAYLOAD]:")
                print("★" * 60)
                print(json.dumps(message, indent=2))
                print("★" * 60 + "\n")
            except Exception as e:
                print("Received raw data:", data.decode("utf-8", errors="ignore"))

        conn.close()

    except KeyboardInterrupt:
        print("\nStopping receiver server.")
        server.close()
        sys.exit(0)
