from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String, ForeignKey("incidents.incident_id"), nullable=False, index=True)
    event_id = Column(String, ForeignKey("events.event_id"), nullable=False, index=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
