"""
Monitoring API Endpoints & High-Performance WebSocket Stream
Supports live camera frame ingestion, in-memory audio chunk processing,
and full real-time multi-modal risk fusion.
"""
import base64
import cv2
import numpy as np
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.vision import vision_pipeline
from app.audio import audio_classifier, audio_processor
from app.core.simulation_engine import simulation_engine
from app.core.risk_engine import risk_engine
from app.core.notification_engine import notification_hub
from app.schemas.alert import (
    VisualDetectionResult,
    AudioClassificationResult,
    UnifiedRiskState
)
from pydantic import BaseModel

logger = logging.getLogger("sentinel.api.monitoring")

router = APIRouter(prefix="/monitor", tags=["Monitoring"])

class FramePayload(BaseModel):
    image_base64: str

class AudioPayload(BaseModel):
    pcm_base64: str

class MultimodalPayload(BaseModel):
    image_base64: str = ""
    pcm_base64: str = ""

@router.post("/frame", response_model=VisualDetectionResult)
async def analyze_frame(payload: FramePayload):
    """Process a single camera frame for flames, smoke, people, and movement."""
    try:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
            
        img_bytes = base64.b64decode(raw_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image encoding")
            
        return vision_pipeline.process_frame(frame)
    except Exception as e:
        logger.error(f"Frame analysis error: {e}")
        return VisualDetectionResult()

@router.post("/audio", response_model=AudioClassificationResult)
async def analyze_audio(payload: AudioPayload):
    """Process an in-memory audio chunk for safety acoustic hazards."""
    return audio_processor.process_base64_audio(payload.pcm_base64)

@router.post("/fuse", response_model=UnifiedRiskState)
async def fuse_telemetry(payload: MultimodalPayload):
    """Run full end-to-end multi-modal risk fusion on current camera frame and audio buffer."""
    # 1. Vision
    if payload.image_base64:
        try:
            raw_b64 = payload.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",")[1]
            img_bytes = base64.b64decode(raw_b64)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            visual_res = vision_pipeline.process_frame(frame) if frame is not None else VisualDetectionResult()
        except Exception:
            visual_res = VisualDetectionResult()
    else:
        visual_res = VisualDetectionResult()

    # 2. Audio
    if payload.pcm_base64:
        audio_res = audio_processor.process_base64_audio(payload.pcm_base64)
    else:
        audio_res = AudioClassificationResult()

    # 3. Simulated Sensors
    env_res = simulation_engine.get_current_reading()

    # 4. Multi-modal Risk Engine
    risk_state = risk_engine.evaluate(visual_res, audio_res, env_res)

    # 5. Alert Trigger & Dispatch
    await notification_hub.maybe_create_alert(risk_state)
    await notification_hub.broadcast_state(risk_state)

    return risk_state

# --- DUPLEX WEBSOCKET STREAMING ---
@router.websocket("/ws")
async def websocket_telemetry_stream(websocket: WebSocket):
    """
    Bi-directional streaming WebSocket:
    Browser sends { type: 'STREAM_PACKET', image: base64, audio: base64, ... }
    Backend replies with real-time unified telemetry, bounding boxes, risk level, and alarms.
    """
    await notification_hub.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                msg_type = msg.get("type", "")
                
                if msg_type == "STREAM_PACKET":
                    img_b64 = msg.get("image", "")
                    audio_b64 = msg.get("audio", "")
                    
                    # Run Vision
                    visual_res = VisualDetectionResult()
                    if img_b64:
                        if "," in img_b64:
                            img_b64 = img_b64.split(",")[1]
                        img_bytes = base64.b64decode(img_b64)
                        np_arr = np.frombuffer(img_bytes, np.uint8)
                        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                        if frame is not None:
                            visual_res = vision_pipeline.process_frame(frame)
                            
                    # Run Audio
                    audio_res = AudioClassificationResult()
                    if audio_b64:
                        audio_res = audio_processor.process_base64_audio(audio_b64)
                        
                    # Environment reading
                    env_res = simulation_engine.get_current_reading()
                    
                    # Risk Engine
                    risk_state = risk_engine.evaluate(visual_res, audio_res, env_res)
                    
                    # Check for persistent alerts
                    await notification_hub.maybe_create_alert(risk_state)
                    
                    # Send response back to this client
                    await websocket.send_json({
                        "type": "TELEMETRY_UPDATE",
                        "data": risk_state.dict(default=str)
                    })
                    
                elif msg_type == "HEARTBEAT":
                    await websocket.send_json({"type": "PONG"})
                    
            except Exception as inner_e:
                logger.error(f"Error handling WS packet: {inner_e}")
    except WebSocketDisconnect:
        notification_hub.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket unhandled error: {e}")
        notification_hub.disconnect(websocket)
