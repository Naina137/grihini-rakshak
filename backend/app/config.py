"""
SENTINEL AI - Autonomous Room Safety Guardian
Configuration and runtime parameters
"""
import os
from typing import List, Dict, Any
from pydantic import BaseModel

class AppSettings(BaseModel):
    APP_NAME: str = "SENTINEL AI"
    TAGLINE: str = "Your Room. Your Safety. Your AI Guardian."
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Active monitoring zone
    DEFAULT_ROOM_ID: str = "ROOM-ALPHA-01"
    DEFAULT_ROOM_NAME: str = "Living Area & Home Office"
    
    # Risk Engine Thresholds
    FIRE_CONFIDENCE_THRESHOLD: float = 0.65
    SMOKE_CONFIDENCE_THRESHOLD: float = 0.55
    GLASS_BREAK_THRESHOLD: float = 0.70
    ALARM_SOUND_THRESHOLD: float = 0.68
    SCREAM_THRESHOLD: float = 0.65
    IMPACT_THRESHOLD: float = 0.75
    MOTION_THRESHOLD: float = 0.40
    
    # Environmental Thresholds (Simulation mode)
    TEMP_WARNING_CELSIUS: float = 45.0
    TEMP_CRITICAL_CELSIUS: float = 60.0
    SMOKE_PPM_WARNING: float = 120.0
    SMOKE_PPM_CRITICAL: float = 300.0
    GAS_PPM_WARNING: float = 250.0
    GAS_PPM_CRITICAL: float = 600.0
    
    # Temporal Verification (consecutive positive detections required to avoid false positives)
    TEMPORAL_VERIFICATION_FRAMES: int = 3
    TEMPORAL_AUDIO_CHUNKS: int = 2
    
    # Privacy Settings
    LOCAL_PROCESSING_ONLY: bool = True
    ALLOW_RAW_AUDIO_STORAGE: bool = False  # NEVER store raw audio unnecessarily
    ALLOW_RAW_FRAME_STORAGE: bool = False  # Ephemeral memory only
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./sentinel.db")

settings = AppSettings()
