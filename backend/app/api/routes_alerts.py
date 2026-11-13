from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..schemas import AlertAcknowledgeRequest, ContactCreate
from ..database import get_recent_alerts, acknowledge_alert_in_db, get_contacts, save_contact, get_telemetry_history
from ..engine.alert_manager import alert_manager

router = APIRouter()

@router.get("/")
def list_alerts(limit: int = 50):
    return {
        "alerts": get_recent_alerts(limit),
        "active_critical": alert_manager.active_critical_alert
    }

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, body: AlertAcknowledgeRequest):
    success = alert_manager.acknowledge_alert(alert_id, body.notes or "Acknowledged by operator")
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "SUCCESS", "alert_id": alert_id, "message": "Alert acknowledged successfully"}

@router.post("/dismiss-modal")
def dismiss_critical_modal():
    alert_manager.dismiss_critical_modal()
    return {"status": "SUCCESS"}

@router.get("/contacts")
def list_contacts():
    return {"contacts": get_contacts()}

@router.post("/contacts")
def create_or_update_contact(contact: ContactCreate):
    import uuid
    c_id = contact.id or f"c-{uuid.uuid4().hex[:6]}"
    c_dict = {
        "id": c_id,
        "name": contact.name,
        "phone": contact.phone,
        "relationship": contact.relationship,
        "email": contact.email,
        "is_active": contact.is_active,
        "auto_alert": contact.auto_alert
    }
    save_contact(c_dict)
    return {"status": "SUCCESS", "contact": c_dict}

@router.get("/timeline")
def get_timeline(limit: int = 40):
    return {"events": get_telemetry_history(limit)}
