import os

class Settings:
    PROJECT_NAME: str = "SENTINEL AI"
    TAGLINE: str = "Your Room. Your Safety. Your AI Guardian."
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Storage & DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///sentinel.db")
    
    # Server
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8080"))
    
    # Vision Settings
    FIRE_CONFIDENCE_THRESHOLD: float = 0.65
    SMOKE_CONFIDENCE_THRESHOLD: float = 0.55
    MOTION_SENSITIVITY: float = 0.30
    FLICKER_MIN_HZ: float = 3.0
    FLICKER_MAX_HZ: float = 18.0
    
    # Audio Settings
    AUDIO_SAMPLE_RATE: int = 22050
    ALARM_FREQ_MIN: int = 2800
    ALARM_FREQ_MAX: int = 3400
    GLASS_CENTROID_MIN: int = 4200
    SCREAM_PITCH_MIN: int = 500
    SCREAM_PITCH_MAX: int = 3200
    
    # Temporal & Risk Engine
    TEMPORAL_WINDOW_SECONDS: int = 4
    CRITICAL_CONFIRMATION_FRAMES: int = 2
    
    # Simulated Environment Defaults
    SIM_DEFAULT_TEMP_C: float = 23.5
    SIM_DEFAULT_HUMIDITY_PCT: float = 48.0
    SIM_DEFAULT_SMOKE_PPM: float = 1.2
    SIM_DEFAULT_GAS_PPM: float = 4.0

settings = Settings()
