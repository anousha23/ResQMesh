from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.device import Device
from app.schemas.device import DeviceCreate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(device_in: DeviceCreate, db: Session = Depends(get_db)):
    existing_device = db.query(Device).filter(Device.device_id == device_in.device_id).first()
    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device with ID '{device_in.device_id}' is already registered."
        )

    db_device = Device(
        device_id=device_in.device_id,
        device_type=device_in.device_type,
        role=device_in.role,
        status=device_in.status,
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


@router.get("", response_model=list[DeviceResponse])
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return devices
