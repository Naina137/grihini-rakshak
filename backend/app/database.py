import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sentinel.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        room_name TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score REAL NOT NULL,
        hazards_json TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at TEXT,
        status TEXT DEFAULT 'ACTIVE',
        is_simulated INTEGER DEFAULT 0,
        notes TEXT
    )
    """)
    
    # Event Audit / Telemetry History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        fire_confidence REAL DEFAULT 0,
        smoke_confidence REAL DEFAULT 0,
        people_count INTEGER DEFAULT 0,
        motion_score REAL DEFAULT 0,
        sound_class TEXT DEFAULT 'AMBIENT',
        sound_confidence REAL DEFAULT 0,
        sim_temp REAL DEFAULT 24.0,
        sim_gas REAL DEFAULT 0.0,
        details_json TEXT
    )
    """)
    
    # Emergency Contacts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relationship TEXT NOT NULL,
        email TEXT,
        is_active INTEGER DEFAULT 1,
        auto_alert INTEGER DEFAULT 1
    )
    """)
    
    # System Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)
    
    conn.commit()
    
    # Seed default contacts if empty
    cursor.execute("SELECT COUNT(*) FROM emergency_contacts")
    if cursor.fetchone()[0] == 0:
        default_contacts = [
            ("contact-1", "Security Dispatch / Concierge", "+1 (555) 019-2834", "Building Management", "dispatch@sentinel-ai.local", 1, 1),
            ("contact-2", "Emergency Services (Fire/EMS)", "911 / 112", "Emergency Response", "cad-dispatch@emergency.gov", 1, 1),
            ("contact-3", "Primary Resident", "+1 (555) 839-2041", "Resident", "resident@sentinel-ai.local", 1, 0)
        ]
        cursor.executemany(
            "INSERT INTO emergency_contacts (id, name, phone, relationship, email, is_active, auto_alert) VALUES (?, ?, ?, ?, ?, ?, ?)",
            default_contacts
        )
        conn.commit()
        
    conn.close()

# Helper queries
def save_alert(alert_dict: Dict[str, Any]) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO alerts 
        (id, timestamp, room_name, risk_level, risk_score, hazards_json, evidence_json, acknowledged, acknowledged_at, status, is_simulated, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        alert_dict["id"],
        alert_dict.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        alert_dict.get("room_name", "Primary Monitor Area"),
        alert_dict.get("risk_level", "NORMAL"),
        float(alert_dict.get("risk_score", 0.0)),
        json.dumps(alert_dict.get("hazards", [])),
        json.dumps(alert_dict.get("evidence", {})),
        1 if alert_dict.get("acknowledged", False) else 0,
        alert_dict.get("acknowledged_at"),
        alert_dict.get("status", "ACTIVE"),
        1 if alert_dict.get("is_simulated", False) else 0,
        alert_dict.get("notes", "")
    ))
    conn.commit()
    conn.close()

def get_recent_alerts(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "room_name": r["room_name"],
            "risk_level": r["risk_level"],
            "risk_score": r["risk_score"],
            "hazards": json.loads(r["hazards_json"] or "[]"),
            "evidence": json.loads(r["evidence_json"] or "{}"),
            "acknowledged": bool(r["acknowledged"]),
            "acknowledged_at": r["acknowledged_at"],
            "status": r["status"],
            "is_simulated": bool(r["is_simulated"]),
            "notes": r["notes"]
        })
    conn.close()
    return results

def log_telemetry(data: Dict[str, Any]) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO telemetry_events 
        (timestamp, event_type, risk_level, fire_confidence, smoke_confidence, people_count, motion_score, sound_class, sound_confidence, sim_temp, sim_gas, details_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("timestamp", datetime.utcnow().isoformat() + "Z"),
        data.get("event_type", "PERIODIC_CHECK"),
        data.get("risk_level", "NORMAL"),
        float(data.get("fire_confidence", 0)),
        float(data.get("smoke_confidence", 0)),
        int(data.get("people_count", 0)),
        float(data.get("motion_score", 0)),
        str(data.get("sound_class", "AMBIENT")),
        float(data.get("sound_confidence", 0)),
        float(data.get("sim_temp", 24.0)),
        float(data.get("sim_gas", 0.0)),
        json.dumps(data.get("details", {}))
    ))
    conn.commit()
    conn.close()

def get_telemetry_history(limit: int = 30) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry_events ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for r in reversed(rows):
        results.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "event_type": r["event_type"],
            "risk_level": r["risk_level"],
            "fire_confidence": r["fire_confidence"],
            "smoke_confidence": r["smoke_confidence"],
            "people_count": r["people_count"],
            "motion_score": r["motion_score"],
            "sound_class": r["sound_class"],
            "sound_confidence": r["sound_confidence"],
            "sim_temp": r["sim_temp"],
            "sim_gas": r["sim_gas"],
            "details": json.loads(r["details_json"] or "{}")
        })
    conn.close()
    return results

def acknowledge_alert_in_db(alert_id: str, notes: str = "") -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat() + "Z"
    cursor.execute("""
        UPDATE alerts 
        SET acknowledged = 1, acknowledged_at = ?, status = 'ACKNOWLEDGED', notes = ?
        WHERE id = ?
    """, (now_str, notes, alert_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def get_contacts() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM emergency_contacts WHERE is_active = 1")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "name": r["name"],
            "phone": r["phone"],
            "relationship": r["relationship"],
            "email": r["email"],
            "is_active": bool(r["is_active"]),
            "auto_alert": bool(r["auto_alert"])
        })
    conn.close()
    return results

def save_contact(contact: Dict[str, Any]) -> None:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO emergency_contacts 
        (id, name, phone, relationship, email, is_active, auto_alert)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        contact["id"],
        contact["name"],
        contact["phone"],
        contact["relationship"],
        contact.get("email", ""),
        1 if contact.get("is_active", True) else 0,
        1 if contact.get("auto_alert", True) else 0
    ))
    conn.commit()
    conn.close()
