# ResQMesh Backend - Phase 1 Foundation

ResQMesh is an offline-first disaster response coordination system. This backend service runs locally on a host laptop and receives observations from sensors, drones, cameras, responder devices, and civilian phones over a local network (LAN) without requiring internet connectivity.

## Project Structure

```
resq_backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── database/
│   │   ├── __init__.py
│   │   └── database.py      # SQLite connection & SQLAlchemy setup
│   ├── models/
│   │   ├── __init__.py
│   │   ├── device.py        # Device database ORM model
│   │   └── event.py         # Event database ORM model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── device.py        # Pydantic schemas for devices
│   │   └── event.py         # Pydantic schemas for events
│   └── api/
│       ├── __init__.py
│       ├── devices.py       # API endpoints for device registration/listing
│       └── events.py        # API endpoints for event creation/retrieval
├── tests/
│   ├── __init__.py
│   ├── test_devices.py      # Unit & integration tests for devices
│   └── test_events.py       # Unit & integration tests for events
├── requirements.txt         # Project dependencies
├── .gitignore               # Git ignore rules
└── README.md                # Project documentation
```

## How to Run the Backend

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Uvicorn server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Binding to `0.0.0.0` allows other devices on the same local area network (LAN) to communicate with this host laptop.*

## Testing via Swagger UI

1. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000/docs
   ```

2. **Step 1: Register a Device**
   - Click `POST /devices` -> **Try it out**
   - Enter JSON:
     ```json
     {
       "device_id": "DRONE_01",
       "device_type": "DRONE",
       "role": "SENSOR",
       "status": "ONLINE"
     }
     ```
   - Click **Execute**. You should get HTTP `201 Created`.

3. **Step 2: Submit an Event**
   - Click `POST /events` -> **Try it out**
   - Enter JSON:
     ```json
     {
       "event_id": "E001",
       "device_id": "DRONE_01",
       "timestamp": "2026-09-05T12:00:00",
       "location": {
         "lat": 12.9716,
         "lon": 77.5946
       },
       "event_type": "PERSON_DETECTED",
       "confidence": 0.91,
       "data": {
         "object": "person",
         "count": 3
       }
     }
     ```
   - Click **Execute**. You should get HTTP `201 Created`.

4. **Step 3: Retrieve Stored Events**
   - Click `GET /events` or `GET /events/E001` -> **Try it out** -> **Execute**.

## Running Automated Tests

Run pytest from the project root:
```bash
pytest
```

## Request Flow Explanation

1. **Incoming HTTP Request**: A client (or Swagger UI) sends a POST request with JSON payload to `/events`.
2. **Pydantic Validation**: FastAPI parses and validates the payload using `EventCreate` schema (checking types, optional location fields, confidence, data dictionary).
3. **Device Check**: The router queries SQLite to ensure `device_id` exists in the `devices` table. If absent, returns HTTP `404`.
4. **Duplicate Event Check**: The router verifies that `event_id` doesn't already exist. If duplicate, returns HTTP `400`.
5. **Database Storage**: The event is persisted into the `events` table in SQLite (`resqmesh.db`).
6. **Response Serialization**: The saved event is formatted with `EventResponse` schema and returned to the client with HTTP status `201`.
