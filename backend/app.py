"""
Voice-to-Incident Classification API Server
--------------------------------------------
Lightweight FastAPI server hosting the voice transcript classification endpoint.
Operates completely offline with local keyword/pattern matching and input validation.

Endpoints:
    POST /classify  - Accepts voice transcript & device telemetry, returns streamlined JSON report.
    GET  /health    - Server health check endpoint.
"""

from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
import uvicorn
import logging

from incident_classifier import classify_transcript

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("incident_api")

app = FastAPI(
    title="ResQMesh Voice-to-Incident API",
    description="Offline Local REST API for Voice Transcript Classification & Emergency JSON Schema Generation",
    version="2.0.0"
)

# ---------------------------------------------------------------------------
# WebSocket Forwarding Stub Function
# ---------------------------------------------------------------------------
def send_to_root_node(incident_json: dict) -> bool:
    """
    Stub function to forward the generated incident JSON report to the root node's
    WebSocket endpoint (e.g., ws://root-node-gateway:8080/incidents).
    """
    try:
        incident_id = incident_json.get("incident_id")
        incident_type = incident_json.get("incident_type")
        severity_lvl = incident_json.get("severity", {}).get("level")
        priority_res = incident_json.get("resource_needs", {}).get("priority_resource")
        logger.info(
            f"[WS FORWARD STUB] Dispatched Incident ID={incident_id} | Type={incident_type} | Severity={severity_lvl} | PriorityResource={priority_res}"
        )
        return True
    except Exception as err:
        logger.error(f"[WS FORWARD STUB ERROR] Could not forward incident: {err}")
        return False


# ---------------------------------------------------------------------------
# Input Request Validation Schema
# ---------------------------------------------------------------------------
MAX_TRANSCRIPT_LENGTH = 1000

class IncidentRequest(BaseModel):
    transcript: str = Field(..., description="Raw voice transcript string from STT engine")
    lat: Optional[float] = Field(None, description="Latitude coordinate")
    lon: Optional[float] = Field(None, description="Longitude coordinate")
    landmark_description: Optional[str] = Field(None, description="Description of nearby landmark")
    device_id: Optional[str] = Field(None, description="Optional device ID")
    relay_node_id: Optional[str] = Field(None, description="Optional relay node ID")
    hop_count: Optional[int] = Field(None, description="Optional mesh hop count")
    battery_level_pct: Optional[float] = Field(None, description="Optional battery level")
    gps_accuracy_meters: Optional[float] = Field(None, description="Optional GPS accuracy")
    stt_confidence: Optional[float] = Field(None, description="Optional STT confidence")

    @field_validator("transcript")
    @classmethod
    def validate_transcript(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Transcript cannot be empty or whitespace-only")
        if len(v.strip()) > MAX_TRANSCRIPT_LENGTH:
            raise ValueError(f"Transcript length ({len(v.strip())} characters) exceeds maximum limit of {MAX_TRANSCRIPT_LENGTH}")
        return v.strip()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "Invalid request payload") if errors else "Invalid request payload"
    if msg.startswith("Value error, "):
        msg = msg[len("Value error, "):]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"status": "error", "message": msg}
    )


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ResQMesh Voice Classification API", "offline_mode": True}


@app.post("/classify", status_code=200)
def classify_incident_endpoint(payload: IncidentRequest):
    """
    Main classification endpoint.
    1. Validates input payload.
    2. Invokes rule-based keyword & pattern classifier.
    3. Triggers send_to_root_node WebSocket forwarding stub.
    4. Returns streamlined tactical incident JSON.
    """
    try:
        incident_report = classify_transcript(
            transcript=payload.transcript,
            lat=payload.lat,
            lon=payload.lon,
            landmark_description=payload.landmark_description,
            device_id=payload.device_id,
            relay_node_id=payload.relay_node_id,
            hop_count=payload.hop_count,
            battery_level_pct=payload.battery_level_pct,
            stt_confidence=payload.stt_confidence,
            gps_accuracy_meters=payload.gps_accuracy_meters,
        )

        send_to_root_node(incident_report)
        return incident_report

    except Exception as err:
        logger.error(f"Classification failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal classification error: {str(err)}"
        )


if __name__ == "__main__":
    logger.info("Starting ResQMesh Voice Classification Server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
