"""
Voice Transcript & Audio Classification Router
----------------------------------------------
Accepts audio files (WAV/M4A/MP3) or raw transcripts, transcribes them using local Whisper STT,
and classifies them into streamlined tactical disaster incident reports for rescue teams.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
import logging

from app.classifier import classify_transcript, send_incident
from app.stt_service import transcribe_audio_file

logger = logging.getLogger("classify_api")

router = APIRouter(prefix="", tags=["Voice Classification & STT"])


def send_to_root_node(incident_json: dict) -> bool:
    """
    Forwards the generated incident JSON report to Laptop B over local LAN TCP socket.
    """
    try:
        success = send_incident(incident_json)
        if success:
            logger.info(
                f"[LAN DISPATCH SUCCESS] Transmitted Incident ID={incident_json.get('incident_id')} to Laptop B"
            )
        else:
            logger.warning(
                f"[LAN DISPATCH NOTICE] Host Laptop B not reached over LAN. Preserving incident report locally."
            )
        return success
    except Exception as err:
        logger.error(f"[LAN DISPATCH ERROR] Could not forward incident: {err}")
        return False


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


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "ResQMesh Voice Classification API", "offline_mode": True}


@router.post("/classify", status_code=200)
def classify_incident_endpoint(payload: IncidentRequest):
    """
    Direct text transcript classification endpoint.
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


@router.post("/transcribe", status_code=200)
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """
    Transcribe recorded audio file to text using local offline Whisper STT.
    """
    try:
        content = await file.read()
        stt_result = transcribe_audio_file(content, file.filename or "voice.m4a")
        return stt_result
    except Exception as err:
        logger.error(f"STT transcription endpoint error: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio transcription failed: {str(err)}"
        )


@router.post("/transcribe-and-classify", status_code=200)
async def transcribe_and_classify_endpoint(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    landmark_description: Optional[str] = Form(None),
    fallback_text: Optional[str] = Form(None)
):
    """
    1. Receives actual recorded audio file from user device.
    2. Transcribes audio file offline using Whisper STT.
    3. Runs transcribed text through incident_classifier.py.
    4. Returns full tactical JSON report with actual heard transcript & classified parameters.
    """
    try:
        content = await file.read()
        stt_result = transcribe_audio_file(content, file.filename or "voice.m4a")
        spoken_transcript = stt_result.get("transcript", "").strip()

        # If audio transcription yields empty (or silent recording), fallback to provided text if available
        if not spoken_transcript and fallback_text:
            spoken_transcript = fallback_text.strip()

        if not spoken_transcript:
            spoken_transcript = "Emergency voice report received without clear speech"

        incident_report = classify_transcript(
            transcript=spoken_transcript,
            lat=lat,
            lon=lon,
            landmark_description=landmark_description,
            stt_confidence=stt_result.get("confidence", 0.90),
        )

        send_to_root_node(incident_report)
        return incident_report

    except Exception as err:
        logger.error(f"Transcribe and classify failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio transcription & classification failed: {str(err)}"
        )
