"""
Unit & Integration Tests for Streamlined Voice Classification API
------------------------------------------------------------------
Validates endpoint behaviors, input validation rules, error codes, and tactical schema completeness.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.classify import MAX_TRANSCRIPT_LENGTH

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["offline_mode"] is True


def test_valid_classification_post():
    payload = {
        "transcript": "there's fire everywhere, we're trapped on the second floor, two of us can't walk",
        "lat": 12.9698,
        "lon": 79.1559,
        "landmark_description": "near old library"
    }
    response = client.post("/classify", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Check top-level streamlined keys
    assert "incident_id" in data
    assert "timestamp" in data
    assert "incident_type" in data
    assert "raw_transcript" in data
    assert "location" in data
    assert "victims" in data
    assert "hazards" in data
    assert "resource_needs" in data
    assert "status" in data

    # Verify classification details
    assert data["incident_type"] == "fire"
    assert data["victims"]["mobility_status"] == "some_cannot_walk"
    assert data["location"]["floor_level"] == "second floor"
    assert data["hazards"]["fire"] is True
    assert data["resource_needs"]["priority_resource"] == "fire_suppression"


def test_empty_transcript_rejection():
    payload_empty = {"transcript": ""}
    res1 = client.post("/classify", json=payload_empty)
    assert res1.status_code == 400
    assert "empty" in res1.json()["message"].lower()

    payload_spaces = {"transcript": "   \n\t  "}
    res2 = client.post("/classify", json=payload_spaces)
    assert res2.status_code == 400
    assert "empty" in res2.json()["message"].lower()


def test_oversized_transcript_rejection():
    long_transcript = "help fire " * 150
    assert len(long_transcript) > MAX_TRANSCRIPT_LENGTH

    payload = {"transcript": long_transcript}
    response = client.post("/classify", json=payload)
    assert response.status_code == 400
    assert "exceeds maximum limit" in response.json()["message"].lower()


def test_missing_optional_fields_handling():
    payload_minimal = {"transcript": "gas leak in kitchen smell gas"}
    response = client.post("/classify", json=payload_minimal)
    assert response.status_code == 200
    data = response.json()

    assert data["location"]["latitude"] is None
    assert data["location"]["longitude"] is None
    assert data["incident_type"] == "gas_leak"
