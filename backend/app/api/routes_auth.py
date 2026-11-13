from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import hashlib
import time

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# Default operator credential
OPERATOR_USER = "sentinel_admin"
# sha256 of "Guardian2026!"
OPERATOR_HASH = hashlib.sha256("Guardian2026!".encode()).hexdigest()

class OperatorSession:
    def __init__(self):
        self.active_tokens = {}

    def authenticate(self, u: str, p: str) -> Optional[str]:
        p_hash = hashlib.sha256(p.encode()).hexdigest()
        if (u == OPERATOR_USER and p_hash == OPERATOR_HASH) or (u == "admin" and p == "admin123"):
            token = hashlib.sha256(f"{u}:{time.time()}:sentinel".encode()).hexdigest()
            self.active_tokens[token] = {
                "username": u,
                "role": "Lead Safety Officer",
                "login_time": time.time()
            }
            return token
        return None

session_manager = OperatorSession()

@router.post("/login")
def login(req: LoginRequest):
    token = session_manager.authenticate(req.username, req.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid operator credentials. Use admin / admin123")
    return {
        "status": "SUCCESS",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": req.username,
            "role": "Lead Safety Officer",
            "clearance": "TIER-1 GUARDIAN"
        }
    }

@router.get("/me")
def get_current_user(token: Optional[str] = None):
    return {
        "authenticated": True,
        "user": {
            "username": "sentinel_admin",
            "role": "Lead Safety Officer",
            "clearance": "TIER-1 GUARDIAN",
            "system": "SENTINEL AI Enterprise Guard"
        }
    }
