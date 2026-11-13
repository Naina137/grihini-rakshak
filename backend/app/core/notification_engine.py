"""
Notification & Emergency Alert Dispatcher
Manages real-time WebSocket subscriber channels, Alert persistence,
Emergency contact dispatch, and Firebase Cloud Messaging (FCM) integration.
"""
import time
import logging
import datetime
from typing import List, Set, Dict, Any, Optional
from fastapi import WebSocket
from app.database import db
from app.schemas.alert import UnifiedRiskState

logger = logging.getLogger("sentinel.notification")

class NotificationHub:
    def __init__(self):
        # Connected browser UI clients
        self.active_websockets: Set[WebSocket] = set()
        # Cooldown management per hazard type to avoid flood
        self.last_dispatched: Dict[str, float] = {}
        self.alert_cooldown_seconds: float = 6.0  # Min interval between persistent alerts of same type

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_websockets)}")

    def disconnect(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_websockets)}")

    async def broadcast_state(self, state: UnifiedRiskState):
        """Pushes real-time telemetry to all connected dashboard displays."""
        if not self.active_websockets:
            return
            
        payload = {
            "type": "TELEMETRY_UPDATE",
            "data": state.dict(default=str)
        }
        
        dead_sockets = set()
        for ws in list(self.active_websockets):
            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.add(ws)
                
        for dead in dead_sockets:
            self.active_websockets.discard(dead)

    async def maybe_create_alert(self, state: UnifiedRiskState) -> Optional[dict]:
        """
        Creates a persistent database record if risk level is WARNING, HIGH RISK, or CRITICAL,
        respecting temporal cooldowns.
        """
        if state.risk_level == "NORMAL" or not state.active_hazards:
            return None
            
        primary = state.primary_threat or "UNSPECIFIED_ANOMALY"
        now = time.time()
        
        # Check cooldown
        last_time = self.last_dispatched.get(primary, 0.0)
        if (now - last_time) < self.alert_cooldown_seconds:
            return None
            
        self.last_dispatched[primary] = now
        
        summary = f"[{state.risk_level}] {primary} in {state.room_name} (Combined score: {int(state.combined_score*100)}%)"
        
        alert_data = {
            "room_id": state.room_id,
            "room_name": state.room_name,
            "hazard_type": primary,
            "risk_level": state.risk_level,
            "visual_confidence": state.visual_evidence.fire_confidence or state.visual_evidence.smoke_confidence or 0.0,
            "audio_confidence": state.audio_evidence.hazard_confidence,
            "sensor_confidence": 0.85 if state.environmental_evidence.status != "NORMAL" else 0.0,
            "combined_score": state.combined_score,
            "summary": summary,
            "details": {
                "active_hazards": state.active_hazards,
                "recommendation": state.recommendation,
                "verified": state.verified,
                "simulated_sensors": state.environmental_evidence.dict()
            }
        }
        
        saved_alert = await db.create_alert(alert_data)
        
        # Broadcast alert pop-up event to UI
        alert_event = {
            "type": "NEW_ALERT",
            "data": saved_alert
        }
        
        for ws in list(self.active_websockets):
            try:
                await ws.send_json(alert_event)
            except Exception:
                pass
                
        return saved_alert

    def format_fcm_notification(self, state: UnifiedRiskState) -> Dict[str, Any]:
        priority = "high" if state.risk_level in ["CRITICAL", "HIGH RISK"] else "normal"
        title = f"🚨 SENTINEL ALERT: {state.risk_level} in {state.room_name}"
        body = f"{state.primary_threat or 'Anomaly detected'}. Combined confidence {int(state.combined_score*100)}%."
        
        return {
            "notification": {
                "title": title,
                "body": body,
                "click_action": "FLUTTER_NOTIFICATION_CLICK"
            },
            "data": {
                "room_id": state.room_id,
                "risk_level": state.risk_level,
                "score": str(state.combined_score),
                "timestamp": datetime.datetime.utcnow().isoformat()
            },
            "priority": priority
        }

notification_hub = NotificationHub()
