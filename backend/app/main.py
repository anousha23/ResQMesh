from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.devices import router as devices_router
from app.api.events import router as events_router
from app.api.classify import router as classify_router
from app.database.database import Base, engine

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ResQMesh Backend",
    description="Offline-First Disaster Response Coordination System API",
    version="1.0.0",
)

# Enable CORS for local React Native frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


app.include_router(devices_router)
app.include_router(events_router)
app.include_router(classify_router)


@app.get("/")
def root():
    return {
        "system": "ResQMesh Backend API",
        "status": "ONLINE",
        "endpoints": ["/classify", "/devices", "/events"],
        "docs_url": "/docs"
    }
