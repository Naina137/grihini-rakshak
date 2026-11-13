"""
Alert History, Acknowledgement & Statistics Endpoints
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.database import db
from app.schemas.alert import AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("")
async def list_alerts(
    risk_level: Optional[str] = None,
    hazard_type: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = 0
):
    """Retrieve historical alert log with filtering and pagination."""
    return await db.list_alerts(risk_level, hazard_type, acknowledged, limit, offset)

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    payload: AlertAcknowledgeRequest
):
    """Operator acknowledges an alert event, recording timestamp and operator ID."""
    alert = await db.acknowledge_alert(alert_id, payload.acknowledged_by)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/acknowledge-all")
async def acknowledge_all_alerts(payload: AlertAcknowledgeRequest):
    """Acknowledge all unacknowledged active alerts."""
    count = await db.acknowledge_all(payload.acknowledged_by)
    return {"status": "success", "acknowledged_count": count}

@router.delete("/clear")
async def clear_alert_history():
    """Wipes historical alert logs."""
    await db.clear_alerts()
    return {"status": "success", "message": "Alert history cleared"}

@router.get("/stats")
async def get_alert_stats():
    """Returns quick telemetry breakdown of alerts."""
    return await db.get_stats()
