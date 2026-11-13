import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from ..database import save_alert, get_recent_alerts, acknowledge_alert_in_db, get_contacts

class AlertManager:
    """
    Manages active safety alerts, notification dispatch,
    cooldown deduplication, and acknowledgement states.
    """
    def __init__(self, cooldown_seconds: int = 12):
        self.cooldown_seconds = cooldown_seconds
        self.last_alert_time: Dict[str, float] = {}
        self.active_critical_alert: Optional[Dict[str, Any]] = None

    def process_risk_assessment(self, assessment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        risk_level = assessment.get("risk_level", "NORMAL")
        hazards = assessment.get("hazards", [])
        room_name = assessment.get("room_name", "Primary Monitor Area")
        
        # Only WARNING, HIGH RISK, and CRITICAL generate alerts
        if risk_level == "NORMAL" or len(hazards) == 0:
            return None
            
        now = time.time()
        primary_hazard = hazards[0]
        cooldown_key = f"{room_name}:{primary_hazard}"
        
        last_t = self.last_alert_time.get(cooldown_key, 0)
        
        # Allow immediate escalation if level upgraded to CRITICAL
        if (now - last_t) < self.cooldown_seconds and risk_level != "CRITICAL":
            return None
            
        self.last_alert_time[cooldown_key] = now
        
        alert_id = f"ALT-{int(now)}-{uuid.uuid4().hex[:6].upper()}"
        is_sim = assessment.get("evidence", {}).get("simulation", {}).get("is_simulated", False)
        
        alert_obj = {
            "id": alert_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "room_name": room_name,
            "risk_level": risk_level,
            "risk_score": assessment.get("risk_score", 0.0),
            "hazards": hazards,
            "evidence": assessment.get("evidence", {}),
            "acknowledged": False,
            "acknowledged_at": None,
            "status": "ACTIVE",
            "is_simulated": is_sim,
            "notes": assessment.get("recommended_action", "")
        }
        
        # Save to database
        save_alert(alert_obj)
        
        if risk_level == "CRITICAL":
            self.active_critical_alert = alert_obj
            self._dispatch_emergency_notifications(alert_obj)
            
        return alert_obj

    def _dispatch_emergency_notifications(self, alert_obj: Dict[str, Any]) -> None:
        """
        Dispatches emergency alerts to configured emergency contacts.
        Integrates with Firebase Cloud Messaging / SMS Gateway stubs.
        """
        contacts = get_contacts()
        auto_alert_contacts = [c for c in contacts if c.get("auto_alert", False)]
        
        print(f"[SENTINEL NOTIFICATION ENGINE] Dispatched CRITICAL alert {alert_obj['id']} to {len(auto_alert_contacts)} emergency contacts.")
        for c in auto_alert_contacts:
            print(f" -> Alerted {c['name']} ({c['relationship']}) at {c['phone']} / {c.get('email')}")

    def acknowledge_alert(self, alert_id: str, notes: str = "User acknowledged in console") -> bool:
        success = acknowledge_alert_in_db(alert_id, notes)
        if self.active_critical_alert and self.active_critical_alert.get("id") == alert_id:
            self.active_critical_alert = None
        return success

    def dismiss_critical_modal(self) -> None:
        self.active_critical_alert = None

alert_manager = AlertManager()
