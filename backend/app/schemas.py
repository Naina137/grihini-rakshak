from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = "Acknowledged by user"

class ContactCreate(BaseModel):
    id: Optional[str] = None
    name: str
    phone: str
    relationship: str
    email: Optional[str] = ""
    is_active: bool = True
    auto_alert: bool = True

class SimulationUpdateRequest(BaseModel):
    temperature: float = Field(..., ge=-20, le=150)
    humidity: float = Field(..., ge=0, le=100)
    smoke_ppm: float = Field(..., ge=0, le=100)
    gas_ppm: float = Field(..., ge=0, le=1000)
    preset_name: Optional[str] = "custom"

class FrameAnalysisRequest(BaseModel):
    image_base64: str
    room_name: Optional[str] = "Primary Living Space"
    sensitivity: Optional[float] = 1.0

class AudioChunkAnalysisRequest(BaseModel):
    audio_base64: Optional[str] = None
    sample_rate: Optional[int] = 22050
    synthetic_event: Optional[str] = None # For live test injections

class RiskResponse(BaseModel):
    risk_level: str
    risk_score: float
    hazards: List[str]
    evidence: Dict[str, Any]
    recommended_action: str
    timestamp: str

class RoomConfig(BaseModel):
    room_name: str
    monitoring_enabled: bool
    camera_enabled: bool
    mic_enabled: bool
