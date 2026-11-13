from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import json
import asyncio
from ..schemas import FrameAnalysisRequest, AudioChunkAnalysisRequest
from ..vision.detector import unified_vision
from ..audio.classifier import acoustic_classifier
from ..engine.risk_engine import risk_engine
from ..engine.simulation import environmental_simulator
from ..engine.alert_manager import alert_manager
from ..database import log_telemetry

router = APIRouter()

# Active WebSocket connections
active_connections: List[WebSocket] = []

@router.post("/analyze-frame")
async def analyze_frame(req: FrameAnalysisRequest):
    frame = unified_vision.decode_base64_image(req.image_base64)
    if frame is None:
        return {"error": "Invalid base64 image", "boxes": [], "risk": {"risk_level": "NORMAL", "risk_score": 0.0}}
        
    vision_results = unified_vision.analyze_frame(frame)
    sim_readings = environmental_simulator.get_readings()
    
    # Evaluate risk with visual + simulated atmosphere
    risk_assessment = risk_engine.evaluate(
        vision_data=vision_results,
        audio_data=None,
        sim_data=sim_readings,
        room_name=req.room_name or "Primary Monitor Area"
    )
    
    # Process alerts
    new_alert = alert_manager.process_risk_assessment(risk_assessment)
    
    # Periodic telemetry log (every 10 frames or on hazard)
    if vision_results["frame_index"] % 8 == 0 or risk_assessment["risk_level"] != "NORMAL":
        log_telemetry({
            "event_type": "VISION_CYCLE",
            "risk_level": risk_assessment["risk_level"],
            "fire_confidence": vision_results["fire"]["confidence"],
            "smoke_confidence": vision_results["smoke"]["confidence"],
            "people_count": vision_results["people"]["count"],
            "motion_score": vision_results["motion"]["motion_score"],
            "sim_temp": sim_readings["temperature_c"],
            "sim_gas": sim_readings["gas_ppm"],
            "details": {"hazards": risk_assessment["hazards"]}
        })
        
    response = {
        "vision": vision_results,
        "risk": risk_assessment,
        "simulation": sim_readings,
        "new_alert": new_alert
    }
    
    # Broadcast to any active dashboard websockets
    if len(active_connections) > 0:
        msg = json.dumps({"type": "FRAME_UPDATE", "data": response})
        for conn in list(active_connections):
            try:
                await conn.send_text(msg)
            except Exception:
                pass
                
    return response

@router.post("/analyze-audio")
async def analyze_audio(req: AudioChunkAnalysisRequest):
    if req.synthetic_event:
        audio_signal = acoustic_classifier.synthesize_test_signal(req.synthetic_event)
    elif req.audio_base64:
        audio_signal = acoustic_classifier.decode_audio_chunk(req.audio_base64, req.sample_rate or 22050)
    else:
        audio_signal = acoustic_classifier.synthesize_test_signal("AMBIENT")
        
    audio_results = acoustic_classifier.classify_audio(audio_signal, req.sample_rate or 22050)
    sim_readings = environmental_simulator.get_readings()
    
    risk_assessment = risk_engine.evaluate(
        vision_data=None,
        audio_data=audio_results,
        sim_data=sim_readings,
        room_name="Acoustic Monitor Zone"
    )
    
    new_alert = alert_manager.process_risk_assessment(risk_assessment)
    
    if audio_results["is_hazard"]:
        log_telemetry({
            "event_type": "ACOUSTIC_HAZARD",
            "risk_level": risk_assessment["risk_level"],
            "sound_class": audio_results["primary_class"],
            "sound_confidence": audio_results["confidence"],
            "sim_temp": sim_readings["temperature_c"],
            "sim_gas": sim_readings["gas_ppm"],
            "details": {"hazards": risk_assessment["hazards"]}
        })
        
    return {
        "audio": audio_results,
        "risk": risk_assessment,
        "simulation": sim_readings,
        "new_alert": new_alert
    }

@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Send periodic heartbeat / simulation update if idle
            await asyncio.sleep(1.0)
            sim_data = environmental_simulator.get_readings()
            await websocket.send_text(json.dumps({
                "type": "HEARTBEAT",
                "simulation": sim_data
            }))
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)
