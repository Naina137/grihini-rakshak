"""
Sentinel System Settings & Thresholds Configuration API
"""
from fastapi import APIRouter
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SystemSettingsSchema(BaseModel):
    room_id: str = settings.DEFAULT_ROOM_ID
    room_name: str = settings.DEFAULT_ROOM_NAME
    fire_threshold: float = settings.FIRE_CONFIDENCE_THRESHOLD
    smoke_threshold: float = settings.SMOKE_CONFIDENCE_THRESHOLD
    glass_threshold: float = settings.GLASS_BREAK_THRESHOLD
    alarm_threshold: float = settings.ALARM_SOUND_THRESHOLD
    scream_threshold: float = settings.SCREAM_THRESHOLD
    motion_threshold: float = settings.MOTION_THRESHOLD
    local_processing_only: bool = settings.LOCAL_PROCESSING_ONLY
    allow_raw_audio_storage: bool = False
    allow_raw_frame_storage: bool = False

@router.get("", response_model=SystemSettingsSchema)
async def get_settings():
    return SystemSettingsSchema(
        room_id=settings.DEFAULT_ROOM_ID,
        room_name=settings.DEFAULT_ROOM_NAME,
        fire_threshold=settings.FIRE_CONFIDENCE_THRESHOLD,
        smoke_threshold=settings.SMOKE_CONFIDENCE_THRESHOLD,
        glass_threshold=settings.GLASS_BREAK_THRESHOLD,
        alarm_threshold=settings.ALARM_SOUND_THRESHOLD,
        scream_threshold=settings.SCREAM_THRESHOLD,
        motion_threshold=settings.MOTION_THRESHOLD,
        local_processing_only=settings.LOCAL_PROCESSING_ONLY,
        allow_raw_audio_storage=False,
        allow_raw_frame_storage=False
    )

@router.post("", response_model=SystemSettingsSchema)
async def update_settings(new_settings: SystemSettingsSchema):
    settings.DEFAULT_ROOM_ID = new_settings.room_id
    settings.DEFAULT_ROOM_NAME = new_settings.room_name
    settings.FIRE_CONFIDENCE_THRESHOLD = new_settings.fire_threshold
    settings.SMOKE_CONFIDENCE_THRESHOLD = new_settings.smoke_threshold
    settings.GLASS_BREAK_THRESHOLD = new_settings.glass_threshold
    settings.ALARM_SOUND_THRESHOLD = new_settings.alarm_threshold
    settings.SCREAM_THRESHOLD = new_settings.scream_threshold
    settings.MOTION_THRESHOLD = new_settings.motion_threshold
    settings.LOCAL_PROCESSING_ONLY = new_settings.local_processing_only
    return new_settings
