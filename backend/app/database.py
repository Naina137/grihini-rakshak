"""
Database persistence layer for SENTINEL AI
High-performance asynchronous SQLite database engine with threadpool execution
Zero external DLL dependencies for 100% stability across all OS environments.
"""
import sqlite3
import asyncio
import json
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("sentinel.db")

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sentinel.db")

def _get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

class AsyncDatabase:
    def __init__(self):
        self._lock = asyncio.Lock()

    async def init_db(self):
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, self._sync_init)
        logger.info(f"Sentinel SQLite Database initialized at: {DB_FILE}")

    def _sync_init(self):
        conn = _get_connection()
        cur = conn.cursor()
        
        # Alerts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sentinel_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                room_id TEXT NOT NULL,
                room_name TEXT NOT NULL,
                hazard_type TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                visual_confidence REAL DEFAULT 0.0,
                audio_confidence REAL DEFAULT 0.0,
                sensor_confidence REAL DEFAULT 0.0,
                combined_score REAL DEFAULT 0.0,
                summary TEXT NOT NULL,
                details TEXT,
                acknowledged INTEGER DEFAULT 0,
                acknowledged_at TEXT,
                acknowledged_by TEXT
            )
        """)
        
        # Emergency Contacts table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sentinel_emergency_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                relationship TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                email TEXT,
                notify_on_warning INTEGER DEFAULT 0,
                notify_on_critical INTEGER DEFAULT 1,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL
            )
        """)
        
        # System Settings table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sentinel_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Seed default contacts if empty
        cur.execute("SELECT COUNT(*) as cnt FROM sentinel_emergency_contacts")
        if cur.fetchone()["cnt"] == 0:
            now_iso = datetime.utcnow().isoformat()
            contacts = [
                ("Primary Security Desk", "Building Control", "+1 (555) 911-0144", "dispatch@building-security.org", 0, 1, 1, now_iso),
                ("Fire Service Emergency", "Municipal First Responders", "911", "alerts@fire-dispatch.gov", 0, 1, 1, now_iso),
                ("Room Resident / Guardian", "Home Owner", "+1 (555) 728-3482", "guardian@sentinel-ai.net", 1, 1, 1, now_iso)
            ]
            cur.executemany("""
                INSERT INTO sentinel_emergency_contacts 
                (name, relationship, phone_number, email, notify_on_warning, notify_on_critical, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, contacts)
            
        conn.commit()
        conn.close()

    # --- ALERTS CRUD ---
    async def create_alert(self, alert_data: dict) -> dict:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_create_alert, alert_data)

    def _sync_create_alert(self, d: dict) -> dict:
        conn = _get_connection()
        cur = conn.cursor()
        now_iso = d.get("timestamp") or datetime.utcnow().isoformat()
        details_str = json.dumps(d.get("details", {}))
        
        cur.execute("""
            INSERT INTO sentinel_alerts 
            (timestamp, room_id, room_name, hazard_type, risk_level, visual_confidence, audio_confidence, sensor_confidence, combined_score, summary, details, acknowledged)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now_iso,
            d.get("room_id", "ROOM-ALPHA-01"),
            d.get("room_name", "Living Area & Home Office"),
            d.get("hazard_type", "HAZARD"),
            d.get("risk_level", "WARNING"),
            float(d.get("visual_confidence", 0.0)),
            float(d.get("audio_confidence", 0.0)),
            float(d.get("sensor_confidence", 0.0)),
            float(d.get("combined_score", 0.0)),
            d.get("summary", ""),
            details_str,
            0
        ))
        conn.commit()
        new_id = cur.lastrowid
        cur.execute("SELECT * FROM sentinel_alerts WHERE id = ?", (new_id,))
        row = dict(cur.fetchone())
        row["details"] = json.loads(row["details"]) if row["details"] else {}
        row["acknowledged"] = bool(row["acknowledged"])
        conn.close()
        return row

    async def list_alerts(self, risk_level=None, hazard_type=None, acknowledged=None, limit=50, offset=0) -> List[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_list_alerts, risk_level, hazard_type, acknowledged, limit, offset)

    def _sync_list_alerts(self, risk_level, hazard_type, acknowledged, limit, offset) -> List[dict]:
        conn = _get_connection()
        cur = conn.cursor()
        query = "SELECT * FROM sentinel_alerts WHERE 1=1"
        params = []
        if risk_level:
            query += " AND risk_level = ?"
            params.append(risk_level)
        if hazard_type:
            query += " AND hazard_type LIKE ?"
            params.append(f"%{hazard_type}%")
        if acknowledged is not None:
            query += " AND acknowledged = ?"
            params.append(1 if acknowledged else 0)
        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cur.execute(query, params)
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            d["details"] = json.loads(d["details"]) if d["details"] else {}
            d["acknowledged"] = bool(d["acknowledged"])
            rows.append(d)
        conn.close()
        return rows

    async def acknowledge_alert(self, alert_id: int, operator: str) -> Optional[dict]:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_ack_alert, alert_id, operator)

    def _sync_ack_alert(self, alert_id: int, operator: str) -> Optional[dict]:
        conn = _get_connection()
        cur = conn.cursor()
        now_iso = datetime.utcnow().isoformat()
        cur.execute("""
            UPDATE sentinel_alerts 
            SET acknowledged = 1, acknowledged_at = ?, acknowledged_by = ?
            WHERE id = ?
        """, (now_iso, operator, alert_id))
        conn.commit()
        cur.execute("SELECT * FROM sentinel_alerts WHERE id = ?", (alert_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        d["details"] = json.loads(d["details"]) if d["details"] else {}
        d["acknowledged"] = bool(d["acknowledged"])
        return d

    async def acknowledge_all(self, operator: str) -> int:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_ack_all, operator)

    def _sync_ack_all(self, operator: str) -> int:
        conn = _get_connection()
        cur = conn.cursor()
        now_iso = datetime.utcnow().isoformat()
        cur.execute("""
            UPDATE sentinel_alerts 
            SET acknowledged = 1, acknowledged_at = ?, acknowledged_by = ?
            WHERE acknowledged = 0
        """, (now_iso, operator))
        count = cur.rowcount
        conn.commit()
        conn.close()
        return count

    async def clear_alerts(self):
        async with self._lock:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._sync_clear_alerts)

    def _sync_clear_alerts(self):
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM sentinel_alerts")
        conn.commit()
        conn.close()

    async def get_stats(self) -> dict:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_stats)

    def _sync_stats(self) -> dict:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as total FROM sentinel_alerts")
        total = cur.fetchone()["total"]
        cur.execute("SELECT COUNT(*) as c FROM sentinel_alerts WHERE risk_level = 'CRITICAL'")
        critical = cur.fetchone()["c"]
        cur.execute("SELECT COUNT(*) as h FROM sentinel_alerts WHERE risk_level = 'HIGH RISK'")
        high_risk = cur.fetchone()["h"]
        cur.execute("SELECT COUNT(*) as w FROM sentinel_alerts WHERE risk_level = 'WARNING'")
        warning = cur.fetchone()["w"]
        cur.execute("SELECT COUNT(*) as u FROM sentinel_alerts WHERE acknowledged = 0")
        unacknowledged = cur.fetchone()["u"]
        conn.close()
        return {
            "total_alerts": total,
            "critical_count": critical,
            "high_risk_count": high_risk,
            "warning_count": warning,
            "unacknowledged_count": unacknowledged
        }

    # --- CONTACTS CRUD ---
    async def list_contacts(self) -> List[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_list_contacts)

    def _sync_list_contacts(self) -> List[dict]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM sentinel_emergency_contacts WHERE is_active = 1 ORDER BY id ASC")
        rows = [dict(r) for r in cur.fetchall()]
        for r in rows:
            r["notify_on_warning"] = bool(r["notify_on_warning"])
            r["notify_on_critical"] = bool(r["notify_on_critical"])
            r["is_active"] = bool(r["is_active"])
        conn.close()
        return rows

    async def create_contact(self, d: dict) -> dict:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_create_contact, d)

    def _sync_create_contact(self, d: dict) -> dict:
        conn = _get_connection()
        cur = conn.cursor()
        now_iso = datetime.utcnow().isoformat()
        cur.execute("""
            INSERT INTO sentinel_emergency_contacts
            (name, relationship, phone_number, email, notify_on_warning, notify_on_critical, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            d["name"],
            d["relationship"],
            d["phone_number"],
            d.get("email"),
            1 if d.get("notify_on_warning") else 0,
            1 if d.get("notify_on_critical", True) else 0,
            1,
            now_iso
        ))
        conn.commit()
        new_id = cur.lastrowid
        cur.execute("SELECT * FROM sentinel_emergency_contacts WHERE id = ?", (new_id,))
        row = dict(cur.fetchone())
        row["notify_on_warning"] = bool(row["notify_on_warning"])
        row["notify_on_critical"] = bool(row["notify_on_critical"])
        row["is_active"] = bool(row["is_active"])
        conn.close()
        return row

    async def delete_contact(self, contact_id: int) -> bool:
        async with self._lock:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, self._sync_delete_contact, contact_id)

    def _sync_delete_contact(self, contact_id: int) -> bool:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM sentinel_emergency_contacts WHERE id = ?", (contact_id,))
        count = cur.rowcount
        conn.commit()
        conn.close()
        return count > 0

    async def get_contact(self, contact_id: int) -> Optional[dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._sync_get_contact, contact_id)

    def _sync_get_contact(self, contact_id: int) -> Optional[dict]:
        conn = _get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM sentinel_emergency_contacts WHERE id = ?", (contact_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        d["notify_on_warning"] = bool(d["notify_on_warning"])
        d["notify_on_critical"] = bool(d["notify_on_critical"])
        d["is_active"] = bool(d["is_active"])
        return d

db = AsyncDatabase()
