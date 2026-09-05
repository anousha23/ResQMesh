# ResQMesh

### Offline-first disaster response coordination

ResQMesh is a disaster response platform designed to work when internet connectivity is unavailable. It enables local devices such as drones, cameras, responder phones, and civilian devices to share emergency information with a local host.

The backend collects observations from different sources, processes them into a common format, and builds a shared view of active incidents for responders and command teams.

> The current prototype operates over an isolated local network. Custom mesh/ad-hoc networking is part of the future scope, not the current implementation.

## Problem

During disasters, internet connectivity and communication infrastructure can become unreliable. At the same time, responders may receive information from many different sources, including cameras, drones, voice reports, GPS devices, and civilian SOS messages.

Without a common system, these observations can remain fragmented and difficult to coordinate.

## Solution

ResQMesh provides a local platform for collecting and coordinating these observations.

Different sources can send different types of data. The host backend normalizes this information, correlates related observations, and turns them into actionable incidents.

The system is designed around local operation, so its core functionality does not depend on cloud services or internet connectivity.

## Key Features

* Offline operation over a local network
* Support for multiple types of data sources
* Event normalization and incident correlation
* Incident severity and confidence handling
* Responder location and status
* Incident assignment to responders
* Real-time updates through WebSockets
* Live disaster map
* Local AI processing
* Custom-tuned YOLO models for disaster-related detection
* Local speech-to-text for voice reports

## How It Works

Devices such as cameras, drones, responder phones, and civilian phones act as sources of information.

The host laptop runs the FastAPI backend and receives these inputs. Since different sources may provide different data formats, the backend converts them into a common internal event structure.

Related events can then be correlated into incidents. Information such as location, severity, supporting sources, and confidence is maintained for each incident.

The processed information is made available to the command dashboard and responder application through REST APIs and WebSockets.

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy, SQLite

**AI:** YOLO, local speech-to-text

**Frontend:** Web-based command dashboard and responder interface

**Networking:** Local Wi-Fi/LAN, with WebSockets for real-time communication

**Mapping:** Offline/local map

## Setup

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd ResQMesh
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API documentation will be available at:

```text
http://127.0.0.1:8000/docs
```

For devices connected to the same local network, the backend can be accessed using the host machine's local IP address.


The backend, frontend, and AI models are developed separately and integrated as the project progresses.

## Future Scope

* Actual mesh/ad-hoc networking
* More disaster-specific AI models
* Additional sensor and device integrations
* Improved incident correlation
* Expanded responder coordination
* More advanced offline mapping

## Team

Built as a third-year student hackathon project.
