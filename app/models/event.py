from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, JSON, String
from app.database.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Event(Base):
    __tablename__ = "events"

    event_id = Column(String, primary_key=True, index=True)
    device_id = Column(String, ForeignKey("devices.device_id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    event_type = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
