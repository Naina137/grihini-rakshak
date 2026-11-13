import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import init_db
from .api.routes_stream import router as stream_router
from .api.routes_alerts import router as alerts_router
from .api.routes_simulation import router as sim_router
from .api.routes_testing import router as test_router
from .api.routes_auth import router as auth_router

# Initialize database schema and tables
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Your Room. Your Safety. Your AI Guardian. Software-only intelligent multi-hazard indoor monitoring system.",
    version=settings.VERSION
)

# Enable CORS for local React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(stream_router, prefix=f"{settings.API_V1_PREFIX}/stream", tags=["Stream Processing"])
app.include_router(alerts_router, prefix=f"{settings.API_V1_PREFIX}/alerts", tags=["Alert Management"])
app.include_router(sim_router, prefix=f"{settings.API_V1_PREFIX}/simulation", tags=["Environmental Simulation"])
app.include_router(test_router, prefix=f"{settings.API_V1_PREFIX}/test", tags=["Verification Lab"])

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "vision_engine": "READY",
        "audio_engine": "READY",
        "risk_engine": "ONLINE",
        "simulation_mode": "ACTIVE_UNRESTRICTED"
    }

# Mount Frontend Build if available for single-command full-stack deployment
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "tagline": settings.TAGLINE,
            "version": settings.VERSION,
            "status": "OPERATIONAL",
            "docs_url": "/docs"
        }
