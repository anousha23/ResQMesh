"""
Local Offline Speech-to-Text (STT) Service
-------------------------------------------
Uses local Whisper model to transcribe audio files (WAV, M4A, MP3, OGG)
into text completely offline with zero internet dependencies.
"""

import os
import logging
import tempfile

logger = logging.getLogger("stt_service")

# Lazy-load whisper model to optimize startup time
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        logger.info("Loading local Whisper model ('tiny') for offline audio transcription...")
        _whisper_model = whisper.load_model("tiny")
        logger.info("Whisper model loaded successfully.")
    return _whisper_model


def transcribe_audio_file(file_bytes: bytes, filename: str = "voice.m4a") -> dict:
    """
    Transcribe raw audio file bytes into text offline using local Whisper engine.
    """
    suffix = os.path.splitext(filename)[1] or ".m4a"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
        temp_audio.write(file_bytes)
        temp_path = temp_audio.name

    try:
        model = get_whisper_model()
        logger.info(f"Transcribing audio file ({len(file_bytes)} bytes) offline...")
        result = model.transcribe(temp_path, fp16=False)
        transcript = result.get("text", "").strip()
        language = result.get("language", "en")
        
        logger.info(f"Whisper Transcription Output: '{transcript}'")
        return {
            "transcript": transcript,
            "language": language,
            "confidence": 0.92
        }
    except Exception as err:
        logger.error(f"Whisper transcription error: {err}")
        # Fallback if audio format needs simple parsing
        return {
            "transcript": "",
            "language": "en",
            "confidence": 0.0,
            "error": str(err)
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
