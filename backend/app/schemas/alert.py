"""
Pydantic Schemas for Detections, Alerts, and Environmental Simulation
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import datetime

# --- DETECTION SCHEMAS ---
class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    label: str
    confidence: float

class VisualDetectionResult(BaseModel):
    has_fire: bool = False
    fire_confidence: float = 0.0
    fire_regions: List[BoundingBox] = []
    
    has_smoke: bool = False
    smoke_confidence: float = 0.0
    smoke_regions: List[BoundingBox] = []
    
    people_count: int = 0
    people_regions: List[BoundingBox] = []
    
    has_unusual_motion: bool = False
    motion_intensity: float = 0.0
    motion_description: str = "Stable"
    
    analysis_latency_ms: float = 0.0
    timestamp: float = Field(default_factory=lambda: datetime.datetime.utcnow().timestamp())

class AudioClassificationResult(BaseModel):
    glass_breaking: float = 0.0
    smoke_alarm: float = 0.0
    fire_alarm: float = 0.0
    screaming: float = 0.0
    loud_impact: float = 0.0
    speech_detected: bool = False
    ambient_db: float = 0.0
    top_hazard_sound: Optional[str] = None
    hazard_confidence: float = 0.0
    is_hazard: bool = False
    analysis_latency_ms: float = 0.0
    timestamp: float = Field(default_factory=lambda: datetime.datetime.utcnow().timestamp())

# --- SIMULATION SCHEMAS ---
class EnvironmentalSensorData(BaseModel):
    is_simulated: bool = True  # ALWAYS explicitly labelled
    label: str = "SIMULATED SENSOR SUITE"
    temperature_celsius: float = 23.5
    humidity_percent: float = 48.0
    smoke_ppm: float = 18.0
    gas_ppm: float = 35.0  # CO / combustible gas
    air_quality_index: int = 42
    status: str = "NORMAL" # NORMAL, WARNING, CRITICAL
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class SensorHazardInjection(BaseModel):
    hazard_type: Optional[str] = None  # None, "FIRE_TEMP", "SMOKE_SURGE", "GAS_LEAK", "COMBINED"
    temperature_override: Optional[float] = None
    smoke_override: Optional[float] = None
    gas_override: Optional[float] = None

# --- RISK ENGINE SCHEMA ---
class UnifiedRiskState(BaseModel):
    risk_level: str = "NORMAL"  # NORMAL, WARNING, HIGH RISK, CRITICAL
    combined_score: float = 0.0  # 0.0 to 1.0
    active_hazards: List[str] = []
    primary_threat: Optional[str] = None
    
    visual_evidence: VisualDetectionResult
    audio_evidence: AudioClassificationResult
    environmental_evidence: EnvironmentalSensorData
    
    temporal_stability_frames: int = 0
    verified: bool = False
    recommendation: str = "Environment normal. Continuous surveillance active."
    room_id: str = "ROOM-ALPHA-01"
    room_name: str = "Living Area & Home Office"
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# --- ALERT SCHEMAS ---
class AlertResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    room_id: str
    room_name: str
    hazard_type: str
    risk_level: str
    visual_confidence: float
    audio_confidence: float
    sensor_confidence: float
    combined_score: float
    summary: str
    details: Optional[Dict[str, Any]] = None
    acknowledged: bool
    acknowledged_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = "Security Operator"

# --- EMERGENCY CONTACT SCHEMAS ---
class EmergencyContactCreate(BaseModel):
    name: str
    relationship: str
    phone_number: str
    email: Optional[str] = None
    notify_on_warning: bool = False
    notify_on_critical: bool = True

class EmergencyContactResponse(EmergencyContactCreate):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
