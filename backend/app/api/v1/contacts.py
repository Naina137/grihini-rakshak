"""
Emergency Contacts Management & Dispatch API
"""
from typing import List
from fastapi import APIRouter, HTTPException
from app.database import db
from app.schemas.alert import EmergencyContactCreate

router = APIRouter(prefix="/contacts", tags=["Emergency Contacts"])

@router.get("")
async def list_contacts():
    return await db.list_contacts()

@router.post("")
async def create_contact(contact_in: EmergencyContactCreate):
    return await db.create_contact(contact_in.dict())

@router.delete("/{contact_id}")
async def delete_contact(contact_id: int):
    success = await db.delete_contact(contact_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"status": "success", "message": f"Deleted contact #{contact_id}"}

@router.post("/{contact_id}/test-alert")
async def trigger_test_alert(contact_id: int):
    """Simulates an automated high-priority emergency call / SMS dispatch to this contact."""
    contact = await db.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    return {
        "status": "DISPATCH_SIMULATED",
        "recipient": contact["name"],
        "phone": contact["phone_number"],
        "message": f"[TEST ALERT] SENTINEL AI: Life safety test drill for {contact['name']}. All systems operational.",
        "delivery_method": "Automated Emergency Voice Call & SMS"
    }
