
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.devices import router as devices_router
from app.api.events import router as events_router
from app.api.incidents import router as incidents_router
from app.database.database import Base, engine
import app.models  # Ensures all models (Device, Event, Incident, IncidentEvent) are registered

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ResQMesh Backend",
    description="Offline-First Disaster Response Coordination System API",
    version="0.2.0",
)

# Enable CORS so the web/React Native frontend (running on a different
# origin/port, e.g. localhost:8082) can actually reach this backend.
# Without this, every response - even a successful one - is blocked by
# the browser before your JS code ever sees it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices_router)
app.include_router(events_router)
app.include_router(incidents_router)



@app.get("/")
def root():
    return {
        "system": "ResQMesh Backend",
        "status": "ONLINE",
        "docs_url": "/docs"
    }