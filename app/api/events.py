from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.device import Device
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse
from app.schemas.incident import EventIngestResponse
from app.services.incident_service import process_event_pipeline

router = APIRouter(prefix="/events", tags=["Events"])


@router.post("", response_model=EventIngestResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    # 1. Check if device exists
    device = db.query(Device).filter(Device.device_id == event_in.device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{event_in.device_id}' not found. Please register the device first."
        )

    # 2. Check for duplicate event ID
    existing_event = db.query(Event).filter(Event.event_id == event_in.event_id).first()
    if existing_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Event with ID '{event_in.event_id}' already exists."
        )

    # 3. Extract lat and lon from location object if provided
    lat = event_in.location.lat if event_in.location else None
    lon = event_in.location.lon if event_in.location else None

    # 4. Create and store event in DB
    db_event = Event(
        event_id=event_in.event_id,
        device_id=event_in.device_id,
        timestamp=event_in.timestamp,
        latitude=lat,
        longitude=lon,
        event_type=event_in.event_type,
        confidence=event_in.confidence,
        data=event_in.data,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # 5. Process event through Phase 2 Incident Intelligence pipeline
    incident, action = process_event_pipeline(db, db_event)

    # 6. Format location output matching EventResponse format
    location_dict = None
    if db_event.latitude is not None or db_event.longitude is not None:
        location_dict = {"lat": db_event.latitude, "lon": db_event.longitude}

    return {
        "event_id": db_event.event_id,
        "device_id": db_event.device_id,
        "timestamp": db_event.timestamp,
        "location": location_dict,
        "event_type": db_event.event_type,
        "confidence": db_event.confidence,
        "data": db_event.data,
        "created_at": db_event.created_at,
        "incident_id": incident.incident_id,
        "incident_action": action,
    }


@router.get("", response_model=list[EventResponse])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return events


@router.get("/{event_id}", response_model=EventResponse)
def get_event_by_id(event_id: str, db: Session = Depends(get_db)):
    db_event = db.query(Event).filter(Event.event_id == event_id).first()
    if not db_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with ID '{event_id}' not found."
        )
    return db_event
