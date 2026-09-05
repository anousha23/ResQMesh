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


def test_device_registration():
    response = client.post(
        "/devices",
        json={
            "device_id": "DRONE_01",
            "device_type": "DRONE",
            "role": "SENSOR",
            "status": "ONLINE",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["device_id"] == "DRONE_01"
    assert data["device_type"] == "DRONE"
    assert data["role"] == "SENSOR"
    assert data["status"] == "ONLINE"
    assert "created_at" in data
    assert "last_seen" in data


def test_duplicate_device_handling():
    device_payload = {
        "device_id": "DRONE_01",
        "device_type": "DRONE",
        "role": "SENSOR",
        "status": "ONLINE",
    }
    # Register once
    res1 = client.post("/devices", json=device_payload)
    assert res1.status_code == 201

    # Attempt to register again with same device_id
    res2 = client.post("/devices", json=device_payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_get_devices():
    client.post(
        "/devices",
        json={
            "device_id": "PHONE_01",
            "device_type": "PHONE",
            "role": "RESPONDER",
            "status": "ONLINE",
        },
    )
    client.post(
        "/devices",
        json={
            "device_id": "CAM_01",
            "device_type": "CAMERA",
            "role": "SENSOR",
            "status": "OFFLINE",
        },
    )

    response = client.get("/devices")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    device_ids = [d["device_id"] for d in data]
    assert "PHONE_01" in device_ids
    assert "CAM_01" in device_ids
