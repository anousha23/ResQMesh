from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String
from app.database.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Device(Base):
    __tablename__ = "devices"

    device_id = Column(String, primary_key=True, index=True)
    device_type = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False)
    last_seen = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
