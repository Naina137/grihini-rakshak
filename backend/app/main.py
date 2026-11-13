"""
SENTINEL AI - Main Application Entrypoint
FastAPI application with Lifespan initialization, CORS, WebSocket routing,
and comprehensive multi-modal safety surveillance APIs.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import db
from app.api.v1.monitoring import router as monitoring_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.sensors import router as sensors_router
from app.api.v1.contacts import router as contacts_router
from app.api.v1.testing import router as testing_router
from app.api.v1.settings import router as settings_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinel.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SENTINEL AI Security Services...")
    await db.init_db()
    logger.info("SENTINEL AI Engine Ready. Autonomous monitoring operational.")
    yield
    logger.info("Shutting down SENTINEL AI Security Services.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Your Room. Your Safety. Your AI Guardian. Autonomous Visual & Acoustic Room Safety Surveillance.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(monitoring_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(sensors_router, prefix="/api/v1")
app.include_router(contacts_router, prefix="/api/v1")
app.include_router(testing_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "system": settings.APP_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "room": settings.DEFAULT_ROOM_NAME,
        "privacy": "Local Processing Only - No Raw Audio/Video Storage"
    }

# Mount static files directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
