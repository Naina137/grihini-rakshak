"""
Sentinel Data Models
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any

@dataclass
class AlertItem:
    id: int
    timestamp: str
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
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None
    acknowledged_by: Optional[str] = None

@dataclass
class EmergencyContactItem:
    id: int
    name: str
    relationship: str
    phone_number: str
    email: Optional[str] = None
    notify_on_warning: bool = False
    notify_on_critical: bool = True
    is_active: bool = True
    created_at: str = ""
