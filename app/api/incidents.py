from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentResponse
from app.services.correlation import haversine_distance_km

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# ---------------------------------------------------------------------------
# Base Station location (Laptop B) - demo/hardcoded value.
# Replace with real coordinates once the actual base station location is known.
# ---------------------------------------------------------------------------
BASE_STATION_LAT = 12.9698
BASE_STATION_LON = 79.1559

# Severity ranking used for sort order - higher number sorts first
SEVERITY_RANK = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1,
}


def compute_distance_from_base(incident: Incident) -> Optional[float]:
    """Returns distance in km from the base station, or None if incident has no location."""
    if incident.latitude is None or incident.longitude is None:
        return None
    return round(
        haversine_distance_km(
            BASE_STATION_LAT, BASE_STATION_LON, incident.latitude, incident.longitude
        ),
        2,
    )


def format_incident_response(incident: Incident) -> dict:
    """Formats an Incident ORM model into dictionary matching IncidentResponse schema."""
    return {
        "incident_id": incident.incident_id,
        "incident_type": incident.incident_type,
        "severity": incident.severity,
        "status": incident.status,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "people_affected": incident.people_affected,
        "confidence": incident.confidence,
        "distance_from_base_km": compute_distance_from_base(incident),
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
        "supporting_events": incident.events,
    }


@router.get("", response_model=list[IncidentResponse])
def get_incidents(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter incidents by status, e.g. OPEN, DISPATCHED, RESOLVED, CLOSED",
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter.upper())

    incidents = query.all()

    # Sort: severity CRITICAL first, then most recently updated first within each tier.
    # Two-pass stable sort: sort by updated_at desc first, then by severity rank -
    # Python's sort is stable, so the updated_at order is preserved within each severity group.
    incidents.sort(key=lambda inc: inc.updated_at, reverse=True)
    incidents.sort(key=lambda inc: SEVERITY_RANK.get((inc.severity or "").upper(), 0), reverse=True)

    return [format_incident_response(inc) for inc in incidents]


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_by_id(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found."
        )
    return format_incident_response(incident)