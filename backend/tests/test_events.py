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


def register_test_device(device_id: str = "DRONE_01"):
    return client.post(
        "/devices",
        json={
            "device_id": device_id,
            "device_type": "DRONE",
            "role": "SENSOR",
            "status": "ONLINE",
        },
    )


def test_event_creation():
    register_test_device("DRONE_01")

    payload = {
        "event_id": "E001",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 12.9716, "lon": 77.5946},
        "event_type": "PERSON_DETECTED",
        "confidence": 0.91,
        "data": {"object": "person", "count": 3},
    }

    response = client.post("/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["event_id"] == "E001"
    assert data["device_id"] == "DRONE_01"
    assert data["location"] == {"lat": 12.9716, "lon": 77.5946}
    assert data["event_type"] == "PERSON_DETECTED"
    assert data["confidence"] == 0.91
    assert data["data"] == {"object": "person", "count": 3}
    assert "created_at" in data


def test_unknown_device_rejection():
    payload = {
        "event_id": "E002",
        "device_id": "NON_EXISTENT_DEVICE",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 12.9716, "lon": 77.5946},
        "event_type": "FIRE_DETECTED",
        "confidence": 0.85,
        "data": {},
    }
    response = client.post("/events", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_duplicate_event_rejection():
    register_test_device("DRONE_01")

    payload = {
        "event_id": "E001",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "event_type": "PERSON_DETECTED",
        "confidence": 0.9,
    }

    res1 = client.post("/events", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/events", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_event_retrieval_by_id():
    register_test_device("DRONE_01")

    payload = {
        "event_id": "E003",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": {"lat": 13.0, "lon": 78.0},
        "event_type": "SOS_SIGNAL",
        "confidence": 0.99,
        "data": {"sos": True},
    }
    client.post("/events", json=payload)

    # Get event by ID
    res = client.get("/events/E003")
    assert res.status_code == 200
    data = res.json()
    assert data["event_id"] == "E003"
    assert data["event_type"] == "SOS_SIGNAL"

    # Get non-existent event
    res_404 = client.get("/events/E999")
    assert res_404.status_code == 404


def test_nullable_confidence_and_location():
    register_test_device("DRONE_01")

    # Event without location and without confidence
    payload = {
        "event_id": "E004",
        "device_id": "DRONE_01",
        "timestamp": "2026-09-05T12:00:00",
        "location": None,
        "event_type": "SYSTEM_STATUS",
        "confidence": None,
        "data": {"status": "ok"},
    }

    response = client.post("/events", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["event_id"] == "E004"
    assert data["location"] is None
    assert data["confidence"] is None

    # Retrieve to verify persistence
    get_res = client.get("/events/E004")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["location"] is None
    assert retrieved["confidence"] is None
