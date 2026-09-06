import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.database import Base, get_db
from app.main import app

# Create in-memory SQLite engine for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def register_device(device_id: str, device_type: str = "DRONE", role: str = "SENSOR"):
    return client.post(
        "/devices",
        json={
            "device_id": device_id,
            "device_type": device_type,
            "role": role,
            "status": "ONLINE",
        },
    )


# 1. Valid event creates an incident
def test_valid_event_creates_incident():
    register_device("DRONE_01")
    payload = {
        "event_id": "E001",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 12.9716, "lon": 77.5946},
        "event_type": "PERSON_DETECTED",
        "confidence": 0.91,
        "data": {"count": 3},
    }
    response = client.post("/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "incident_id" in data
    assert data["incident_action"] == "CREATED"

    # Verify incident exists
    inc_res = client.get(f"/incidents/{data['incident_id']}")
    assert inc_res.status_code == 200
    inc_data = inc_res.json()
    assert inc_data["incident_type"] == "PERSON_DETECTED"
    assert len(inc_data["supporting_events"]) == 1


# 2. Two related events are fused into one incident
def test_two_related_events_fuse():
    register_device("DRONE_01")
    register_device("RESPONDER_01", "PHONE", "RESPONDER")

    # Event 1
    res1 = client.post(
        "/events",
        json={
            "event_id": "E001",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.91,
            "data": {"count": 3},
        },
    )
    inc_id_1 = res1.json()["incident_id"]

    # Event 2 (same area, short time delta, compatible type)
    res2 = client.post(
        "/events",
        json={
            "event_id": "E002",
            "device_id": "RESPONDER_01",
            "timestamp": "2026-09-05T12:05:00",
            "location": {"lat": 12.9718, "lon": 77.5948},
            "event_type": "TRAPPED_PERSON",
            "confidence": 0.85,
            "data": {"message": "3 people trapped inside building"},
        },
    )
    data2 = res2.json()
    assert data2["incident_action"] == "ATTACHED"
    assert data2["incident_id"] == inc_id_1

    # Verify incident contains 2 supporting events
    inc_res = client.get(f"/incidents/{inc_id_1}")
    assert inc_res.status_code == 200
    inc = inc_res.json()
    assert len(inc["supporting_events"]) == 2


# 3. Unrelated events create separate incidents
def test_unrelated_events_create_separate_incidents():
    register_device("DRONE_01")
    register_device("CAM_01", "CAMERA", "SENSOR")

    # Person detection at Location A
    res1 = client.post(
        "/events",
        json={
            "event_id": "E101",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
        },
    )

    # Road blockage far away at Location B
    res2 = client.post(
        "/events",
        json={
            "event_id": "E102",
            "device_id": "CAM_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 13.5000, "lon": 78.5000},
            "event_type": "BLOCKED_ROAD",
        },
    )

    assert res1.json()["incident_id"] != res2.json()["incident_id"]
    assert res1.json()["incident_action"] == "CREATED"
    assert res2.json()["incident_action"] == "CREATED"


# 4. Events outside time window do not fuse
def test_events_outside_time_window_do_not_fuse():
    register_device("DRONE_01")
    register_device("DRONE_02")

    res1 = client.post(
        "/events",
        json={
            "event_id": "E201",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T08:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
        },
    )

    # Same location, but 5 hours later (> 60 mins limit)
    res2 = client.post(
        "/events",
        json={
            "event_id": "E202",
            "device_id": "DRONE_02",
            "timestamp": "2026-09-05T13:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
        },
    )

    assert res1.json()["incident_id"] != res2.json()["incident_id"]
    assert res2.json()["incident_action"] == "CREATED"


# 5. Events outside geographic threshold do not fuse
def test_events_outside_geo_threshold_do_not_fuse():
    register_device("DRONE_01")
    register_device("DRONE_02")

    # Location A
    res1 = client.post(
        "/events",
        json={
            "event_id": "E301",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "FIRE_DETECTED",
        },
    )

    # 10 km away (outside 0.5 km limit)
    res2 = client.post(
        "/events",
        json={
            "event_id": "E302",
            "device_id": "DRONE_02",
            "timestamp": "2026-09-05T12:02:00",
            "location": {"lat": 13.0616, "lon": 77.5946},
            "event_type": "FIRE_DETECTED",
        },
    )

    assert res1.json()["incident_id"] != res2.json()["incident_id"]
    assert res2.json()["incident_action"] == "CREATED"


# 6. Multiple events from the same device are not counted as multiple independent sources
def test_same_device_duplicate_events_independence():
    register_device("DRONE_01")

    # Three events from DRONE_01 at same spot
    r1 = client.post(
        "/events",
        json={
            "event_id": "ED1",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.80,
        },
    )
    inc_id = r1.json()["incident_id"]

    client.post(
        "/events",
        json={
            "event_id": "ED2",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:01:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.80,
        },
    )
    client.post(
        "/events",
        json={
            "event_id": "ED3",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:02:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.80,
        },
    )

    inc = client.get(f"/incidents/{inc_id}").json()
    assert len(inc["supporting_events"]) == 3
    # Distinct source count is 1, so confidence should not boost beyond base confidence 0.80
    assert inc["confidence"] == 0.80


# 7. Event confidence is preserved
def test_event_confidence_preserved():
    register_device("DRONE_01")
    payload = {
        "event_id": "EC1",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 12.9716, "lon": 77.5946},
        "event_type": "PERSON_DETECTED",
        "confidence": 0.91,
    }
    r = client.post("/events", json=payload)
    assert r.json()["confidence"] == 0.91

    evt = client.get("/events/EC1").json()
    assert evt["confidence"] == 0.91


# 8. Missing/null confidence is handled
def test_missing_null_confidence_handled():
    register_device("CIVILIAN_01", "PHONE", "CIVILIAN")
    payload = {
        "event_id": "EC2",
        "device_id": "CIVILIAN_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 12.9716, "lon": 77.5946},
        "event_type": "SOS",
        "confidence": None,
    }
    r = client.post("/events", json=payload)
    assert r.status_code == 201
    assert r.json()["confidence"] is None

    inc = client.get(f"/incidents/{r.json()['incident_id']}").json()
    assert inc["confidence"] == 0.60  # Default baseline for manual/null confidence report


# 9. Incident confidence updates when additional supporting sources arrive
def test_incident_confidence_updates_with_distinct_sources():
    register_device("DRONE_01")
    register_device("RESPONDER_01", "PHONE", "RESPONDER")
    register_device("CIVILIAN_01", "PHONE", "CIVILIAN")

    # Source 1
    r1 = client.post(
        "/events",
        json={
            "event_id": "ES1",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.80,
        },
    )
    inc_id = r1.json()["incident_id"]
    inc1 = client.get(f"/incidents/{inc_id}").json()
    assert inc1["confidence"] == 0.80  # 1 source

    # Source 2
    client.post(
        "/events",
        json={
            "event_id": "ES2",
            "device_id": "RESPONDER_01",
            "timestamp": "2026-09-05T12:01:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "TRAPPED_PERSON",
            "confidence": 0.85,
        },
    )
    inc2 = client.get(f"/incidents/{inc_id}").json()
    # base max(0.80, 0.85) = 0.85 + (2-1)*0.10 = 0.95
    assert inc2["confidence"] == 0.95

    # Source 3
    client.post(
        "/events",
        json={
            "event_id": "ES3",
            "device_id": "CIVILIAN_01",
            "timestamp": "2026-09-05T12:02:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "SOS",
            "confidence": None,
        },
    )
    inc3 = client.get(f"/incidents/{inc_id}").json()
    # 3 distinct sources boost capped at 0.99
    assert inc3["confidence"] == 0.99


# 10. Severity changes when stronger evidence arrives
def test_severity_changes_with_stronger_evidence():
    register_device("DRONE_01")
    register_device("RESPONDER_01", "PHONE", "RESPONDER")

    # Initial drone report -> LOW severity
    r1 = client.post(
        "/events",
        json={
            "event_id": "EV_SEV1",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "data": {"count": 1},
        },
    )
    inc_id = r1.json()["incident_id"]
    inc1 = client.get(f"/incidents/{inc_id}").json()
    assert inc1["severity"] == "LOW"

    # Stronger report arriving -> CRITICAL severity
    client.post(
        "/events",
        json={
            "event_id": "EV_SEV2",
            "device_id": "RESPONDER_01",
            "timestamp": "2026-09-05T12:01:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "TRAPPED_PERSON",
            "data": {"message": "3 people trapped inside collapse", "count": 3},
        },
    )
    inc2 = client.get(f"/incidents/{inc_id}").json()
    assert inc2["severity"] == "CRITICAL"
    assert inc2["people_affected"] == 3


# 11. Incident-event relationships are stored correctly
def test_incident_event_relationships_stored():
    register_device("DRONE_01")
    r = client.post(
        "/events",
        json={
            "event_id": "EREL_1",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "FIRE_DETECTED",
        },
    )
    inc_id = r.json()["incident_id"]

    inc = client.get(f"/incidents/{inc_id}").json()
    assert inc["incident_id"] == inc_id
    assert len(inc["supporting_events"]) == 1
    assert inc["supporting_events"][0]["event_id"] == "EREL_1"


# 12. Phase 2 Success Criteria Full Workflow
def test_phase_2_success_criteria_workflow():
    register_device("DRONE_01", "DRONE", "SENSOR")
    register_device("RESPONDER_01", "PHONE", "RESPONDER")
    register_device("CIVILIAN_01", "PHONE", "CIVILIAN")

    # Event 1: Drone reports PERSON_DETECTED, count=3, loc A, conf=0.91
    e1 = client.post(
        "/events",
        json={
            "event_id": "E_WF1",
            "device_id": "DRONE_01",
            "timestamp": "2026-09-05T12:00:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "PERSON_DETECTED",
            "confidence": 0.91,
            "data": {"count": 3},
        },
    )
    assert e1.json()["incident_action"] == "CREATED"
    inc_id = e1.json()["incident_id"]

    # Event 2: Responder reports TRAPPED_PERSON, count=3, loc A
    e2 = client.post(
        "/events",
        json={
            "event_id": "E_WF2",
            "device_id": "RESPONDER_01",
            "timestamp": "2026-09-05T12:03:00",
            "location": {"lat": 12.9717, "lon": 77.5947},
            "event_type": "TRAPPED_PERSON",
            "data": {"message": "3 people stuck under structure"},
        },
    )
    assert e2.json()["incident_action"] == "ATTACHED"
    assert e2.json()["incident_id"] == inc_id

    # Event 3: Civilian sends SOS, loc A
    e3 = client.post(
        "/events",
        json={
            "event_id": "E_WF3",
            "device_id": "CIVILIAN_01",
            "timestamp": "2026-09-05T12:05:00",
            "location": {"lat": 12.9716, "lon": 77.5946},
            "event_type": "SOS",
        },
    )
    assert e3.json()["incident_action"] == "ATTACHED"
    assert e3.json()["incident_id"] == inc_id

    # Verify final incident state
    final_inc = client.get(f"/incidents/{inc_id}").json()
    assert final_inc["incident_id"] == inc_id
    assert final_inc["incident_type"] == "TRAPPED_PERSON"
    assert final_inc["people_affected"] == 3
    assert final_inc["severity"] == "CRITICAL"
    assert final_inc["confidence"] >= 0.99
    assert len(final_inc["supporting_events"]) == 3

    device_ids_supporting = [evt["device_id"] for evt in final_inc["supporting_events"]]
    assert "DRONE_01" in device_ids_supporting
    assert "RESPONDER_01" in device_ids_supporting
    assert "CIVILIAN_01" in device_ids_supporting


# 13. Test nested Whisper voice report (Flood + Kids) severity escalation to CRITICAL
def test_whisper_flood_payload_severity_escalation():
    register_device("laptop-a-001", "LAPTOP", "SENSOR")

    payload = {
        "event_id": "2e53ba52-test-flood-1",
        "device_id": "laptop-a-001",
        "timestamp": "2026-09-05T22:34:09.518435",
        "location": {"lat": 12.9716, "lon": 79.1594},
        "event_type": "flood",
        "confidence": None,
        "data": {
            "incident_id": "2e53ba52-test-flood-1",
            "incident_type": "flood",
            "raw_transcript": "there's a flood, my kids are dying",
            "location": {"latitude": 12.9716, "longitude": 79.1594, "floor_level": None, "landmark": "LAN Emergency Report"},
            "victims": {
                "people_affected": None, "people_trapped": None, "injured_count": None,
                "unconscious": False, "mobility_status": None,
                "vulnerable_groups": {"has_children": True, "has_elderly": False, "has_disabled": False, "has_pregnant": False}
            },
            "hazards": {"fire": False, "smoke": False, "collapse_risk": False, "gas_leak": False, "electrical": False, "chemical": False, "flood": False},
            "resource_needs": {"priority_resource": "evacuation_transport", "needs_medical": False, "needs_extraction": False, "needs_fire_suppression": False, "needs_evacuation_transport": True, "needs_water_supply": False},
            "status": "new"
        },
        "created_at": "2026-09-05T22:34:08.365327"
    }

    res = client.post("/events", json=payload)
    assert res.status_code == 201
    body = res.json()
    inc_id = body["incident_id"]

    inc = client.get(f"/incidents/{inc_id}").json()
    # Classified as FLOOD
    assert inc["incident_type"] == "FLOOD"
    # Severity escalated to CRITICAL due to FLOOD + vulnerable_groups.has_children: True, even with null count!
    assert inc["severity"] == "CRITICAL"


# 14. Test Fire + Trapped payload -> CRITICAL
def test_fire_and_trapped_payload_critical():
    register_device("CAM_02", "CAMERA", "SENSOR")

    payload = {
        "event_id": "E_FIRE_TRAP_1",
        "device_id": "CAM_02",
        "timestamp": "2026-09-05T22:00:00",
        "location": {"lat": 12.9716, "lon": 79.1594},
        "event_type": "FIRE_DETECTED",
        "confidence": 0.88,
        "data": {
            "incident_type": "FIRE_DETECTED",
            "raw_transcript": "Fire breaking out with people trapped inside building",
            "victims": {"people_trapped": 2, "vulnerable_groups": {}}
        }
    }

    res = client.post("/events", json=payload)
    assert res.status_code == 201
    inc = client.get(f"/incidents/{res.json()['incident_id']}").json()
    assert inc["severity"] == "CRITICAL"


# 15. Test Plain low-severity person-detected payload -> LOW
def test_plain_person_detected_payload_low():
    register_device("DRONE_03", "DRONE", "SENSOR")

    payload = {
        "event_id": "E_PERSON_LOW_1",
        "device_id": "DRONE_03",
        "timestamp": "2026-09-05T22:00:00",
        "location": {"lat": 13.0000, "lon": 78.0000},
        "event_type": "PERSON_DETECTED",
        "confidence": 0.95,
        "data": {"count": 1}
    }

    res = client.post("/events", json=payload)
    assert res.status_code == 201
    inc = client.get(f"/incidents/{res.json()['incident_id']}").json()
    assert inc["severity"] == "LOW"
