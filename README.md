# ResQMesh

### Offline-First Disaster Response Coordination & Voice-to-Incident Classification Platform

ResQMesh is a disaster response platform designed to operate seamlessly when internet connectivity is unavailable. It enables edge devices ( responder phones, civilian devices, mesh nodes, sensors) to relay emergency voice reports and telemetry across a local offline network directly to a rescue command dashboard.

---

## Architecture Overview

```
 📱 Edge Device / Microphone
      │  (Speech-to-Text / Offline Whisper)
      ▼
 🎙️ Voice Transcript + GPS Coordinates
      │  (HTTP POST /classify or Mesh Relay)
      ▼
 ⚙️ ResQMesh FastAPI Backend & NLU Classifier Engine (100% Offline)
      │  - Incident Classification (Fire, Flood, Collapse, Medical, Chemical, Active Threat)
      │  - Regex Entity & Location Extraction (Floor level, trapped/injured counts, mobility)
      │  - Triage Severity Scoring (0-10) & Priority Resource Mapping
      ▼
 📋 Tactical Incident Report JSON
      │  (WebSocket Broadcast to Root Node)
      ▼
 🖥️ ResQMesh Rescue Dashboard & Mobile Response App
```

---

## Directory Structure

```text
ResQMesh/
├── backend/                  # Python FastAPI Backend & Rule Engine
│   ├── app/
│   │   ├── api/
│   │   │   ├── classify.py   # Voice classification API endpoint (/classify) & WS forward stub
│   │   │   ├── devices.py    # Device registration endpoints
│   │   │   └── events.py     # General event correlation endpoints
│   │   ├── classifier.py     # Offline regex & keyword NLP incident classifier
│   │   ├── database/         # SQLAlchemy database initialization
│   │   ├── models/           # Data models (Device, Event)
│   │   └── main.py           # FastAPI entrypoint with CORS middleware
│   ├── sample_transcripts.txt # 8 realistic disaster test transcripts
│   ├── test_harness.py       # Batch CLI test harness & tactical matrix generator
│   ├── test_app.py           # Pytest suite for classification endpoint & validation
│   └── requirements.txt      # Python dependencies (FastAPI, uvicorn, pydantic, sqlalchemy)
│
├── frontend/                 # React Native / Expo Mobile Application
│   ├── App.js                # React Native app entrypoint & navigation
│   ├── package.json          # Node.js dependencies
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── localization/     # Multilingual support (English, Hindi)
│       └── screens/
│           ├── Features/     # ReportEmergencyScreen, SafeZonesScreen
│           └── Main/         # SOSScreen (Voice SOS & NLU display), HomeScreen, AlertsScreen
│
└── README.md                 # Complete project documentation
```

---

## Key Features

* **100% Offline AI Voice Classification**: Converts raw voice transcripts into structured tactical JSON reports using local deterministic NLP regex rules. Zero cloud dependencies.
* **Tactical Triage & Priority Resource Mapping**: Automatically evaluates immediate life threats, severity levels (`low`, `moderate`, `high`, `critical`), victim mobility (`none_can_walk`, `some_cannot_walk`, `all_can_walk`), and primary dispatch needs (`fire_suppression`, `extraction`, `medical`, `evacuation_transport`, `water_supply`).
* **Input Validation & Security**: Enforces non-empty transcript validation, 1000-character caps, and handles missing optional metadata safely as `null`.
* **Root Node WebSocket Forwarding**: Includes `send_to_root_node()` stub for transmitting JSON reports to root dashboard gateways.
* **Multi-Platform Mobile Application**: React Native / Expo app supporting Voice SOS, direct emergency reporting, offline safe zone discovery, and mesh network status tracking.

---

## Setup & Running Guide

### 1. Backend Setup (FastAPI & Classifier)

Navigate to the `backend/` directory:
```bash
cd backend
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Run unit tests:
```bash
pytest test_app.py
pytest tests/
```

Run the offline batch test harness:
```bash
python test_harness.py --mode direct
```

Start the local FastAPI backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The interactive API documentation will be available at:
`http://localhost:8000/docs`

---

### 2. Frontend Setup (React Native / Expo App)

In a new terminal window, navigate to the `frontend/` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Expo development server:
```bash
npm start
```

---

## Sample Streamlined Tactical JSON Output

```json
{
  "incident_id": "a8abc6dd-b7b5-4630-85d2-15fdf602f0da",
  "timestamp": "2026-09-05T11:31:47.106800+00:00",
  "incident_type": "fire",
  "raw_transcript": "there's fire everywhere, we're trapped on the second floor, two of us can't walk",
  "severity": {
    "level": "moderate",
    "score": 4,
    "life_threat_immediate": false
  },
  "location": {
    "latitude": 12.9698,
    "longitude": 79.1559,
    "floor_level": "second floor",
    "landmark": "near the old library building"
  },
  "victims": {
    "people_affected": 2,
    "people_trapped": 2,
    "injured_count": null,
    "unconscious": false,
    "mobility_status": "some_cannot_walk",
    "vulnerable_groups": {
      "has_children": false,
      "has_elderly": false,
      "has_disabled": false,
      "has_pregnant": false
    }
  },
  "hazards": {
    "fire": true,
    "smoke": false,
    "collapse_risk": false,
    "gas_leak": false,
    "electrical": false,
    "chemical": false,
    "flood": false
  },
  "resource_needs": {
    "priority_resource": "fire_suppression",
    "needs_medical": true,
    "needs_extraction": false,
    "needs_fire_suppression": true,
    "needs_evacuation_transport": true,
    "needs_water_supply": true
  },
  "status": "new"
}
```

---

## Team

Built as a hackathon project for offline disaster response and emergency coordination.
