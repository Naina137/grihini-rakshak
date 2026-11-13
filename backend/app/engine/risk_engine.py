from typing import Dict, Any, List, Optional
from collections import deque
from datetime import datetime
import time

class IntelligentRiskEngine:
    """
    Multi-modal Risk Engine.
    Fuses real-time Computer Vision evidence, Acoustic classification,
    and simulated Environmental readings.
    
    Risk Levels:
    - NORMAL: Safe ambient state
    - WARNING: Single anomaly / minor motion / isolated smoke
    - HIGH RISK: Unconfirmed fire, verified alarm audio, glass breaking + motion
    - CRITICAL: Confirmed fire + alarm audio, active flame > 85%, or toxic gas spike
    
    Features temporal verification to prevent spurious single-frame false alarms.
    """
    def __init__(self, temporal_window: int = 5):
        self.temporal_window = temporal_window
        self.recent_flame_detections = deque(maxlen=temporal_window)
        self.recent_audio_hazards = deque(maxlen=temporal_window)
        self.recent_motion_levels = deque(maxlen=temporal_window)
        
        # Configurable sensitivity thresholds
        self.thresholds = {
            "fire_high": 0.80,
            "fire_med": 0.55,
            "smoke_high": 0.65,
            "smoke_med": 0.45,
            "audio_alarm_conf": 0.60,
            "glass_conf": 0.65,
            "scream_conf": 0.65,
            "sim_temp_critical": 65.0,
            "sim_gas_critical": 120.0
        }

    def evaluate(
        self,
        vision_data: Optional[Dict[str, Any]] = None,
        audio_data: Optional[Dict[str, Any]] = None,
        sim_data: Optional[Dict[str, Any]] = None,
        room_name: str = "Living Room - Zone A"
    ) -> Dict[str, Any]:
        
        hazards = []
        evidence = {}
        risk_score = 0.0 # 0.0 to 100.0
        
        # 1. Parse Visual Signals
        fire_detected = False
        fire_conf = 0.0
        smoke_detected = False
        smoke_conf = 0.0
        people_count = 0
        unusual_motion = False
        motion_pct = 0.0
        
        if vision_data:
            fire_info = vision_data.get("fire", {})
            fire_detected = fire_info.get("detected", False)
            fire_conf = fire_info.get("confidence", 0.0)
            
            smoke_info = vision_data.get("smoke", {})
            smoke_detected = smoke_info.get("detected", False)
            smoke_conf = smoke_info.get("confidence", 0.0)
            
            people_info = vision_data.get("people", {})
            people_count = people_info.get("count", 0)
            
            motion_info = vision_data.get("motion", {})
            unusual_motion = motion_info.get("unusual_movement", False)
            motion_pct = motion_info.get("motion_pct", 0.0)
            
            evidence["vision"] = {
                "fire_detected": fire_detected,
                "fire_confidence": fire_conf,
                "smoke_detected": smoke_detected,
                "smoke_confidence": smoke_conf,
                "people_count": people_count,
                "unusual_motion": unusual_motion,
                "motion_pct": motion_pct
            }
            
        self.recent_flame_detections.append(1 if (fire_detected and fire_conf >= self.thresholds["fire_med"]) else 0)
        self.recent_motion_levels.append(motion_pct)
        
        # 2. Parse Audio Signals
        audio_class = "AMBIENT"
        audio_conf = 0.0
        is_audio_hazard = False
        
        if audio_data:
            audio_class = audio_data.get("primary_class", "AMBIENT")
            audio_conf = audio_data.get("confidence", 0.0)
            is_audio_hazard = audio_data.get("is_hazard", False)
            
            evidence["audio"] = {
                "primary_class": audio_class,
                "confidence": audio_conf,
                "db_spl": audio_data.get("db_spl", 45.0)
            }
            
        self.recent_audio_hazards.append(audio_class if (is_audio_hazard and audio_conf >= 0.50) else "AMBIENT")
        
        # 3. Parse Environmental Simulation Signals
        sim_temp = 22.0
        sim_gas = 0.0
        sim_smoke = 0.0
        
        if sim_data:
            sim_temp = sim_data.get("temperature_c", 22.0)
            sim_gas = sim_data.get("gas_ppm", 0.0)
            sim_smoke = sim_data.get("smoke_ppm", 0.0)
            evidence["simulation"] = {
                "temperature_c": sim_temp,
                "gas_ppm": sim_gas,
                "smoke_ppm": sim_smoke,
                "is_simulated": True
            }
            
        # 4. Temporal Verification
        recent_fire_hits = sum(self.recent_flame_detections)
        temporally_verified_fire = recent_fire_hits >= 2
        
        # 5. Multi-modal Fusion Rule Matrix
        
        # RULE A: Confirmed Fire Visual + Alarm Audio -> CRITICAL (100%)
        if (fire_detected and fire_conf >= self.thresholds["fire_med"]) and (audio_class in ["SMOKE_ALARM", "FIRE_ALARM"] and audio_conf >= self.thresholds["audio_alarm_conf"]):
            risk_score = 98.0
            hazards.append("VERIFIED ACTIVE FIRE AND EMERGENCY ALARM CONVERGENCE")
            
        # RULE B: High Confidence Flame Detection (> 80%) with temporal verification
        elif fire_detected and fire_conf >= self.thresholds["fire_high"] and temporally_verified_fire:
            risk_score = 92.0
            hazards.append("HIGH CONFIDENCE VISIBLE FLAME DETECTED")
            
        # RULE C: Critical Simulated Atmosphere (Extreme Heat or Toxic Gas) + any visual/audio trigger
        elif (sim_temp >= self.thresholds["sim_temp_critical"] or sim_gas >= self.thresholds["sim_gas_critical"]) and (fire_detected or smoke_detected or is_audio_hazard):
            risk_score = 94.0
            hazards.append("ATMOSPHERIC FLASHOVER & SENSOR HAZARD THRESHOLD EXCEEDED (SIMULATED)")
            
        # RULE D: Smoke visual + Alarm sound
        elif smoke_detected and (audio_class in ["SMOKE_ALARM", "FIRE_ALARM"] and audio_conf >= 0.55):
            risk_score = 88.0
            hazards.append("SMOKE DISPERSION WITH AUDIBLE FIRE ALARM")
            
        # RULE E: Glass Breaking Audio + Unusual Motion -> High Risk (Burglary / Break-in)
        elif audio_class == "GLASS_BREAKING" and audio_conf >= self.thresholds["glass_conf"] and (unusual_motion or motion_pct >= 5.0):
            risk_score = 85.0
            hazards.append("ACOUSTIC GLASS SHATTER CONCURRENT WITH RAPID MOTION (POSSIBLE INTRUSION)")
            
        # RULE F: Screaming / Human Distress Vocalization
        elif audio_class == "SCREAMING" and audio_conf >= self.thresholds["scream_conf"]:
            risk_score = 80.0
            hazards.append("HUMAN VOCAL DISTRESS / SCREAM DETECTED")
            
        # RULE G: Audible Alarm alone (Continuous)
        elif audio_class in ["SMOKE_ALARM", "FIRE_ALARM"] and audio_conf >= self.thresholds["audio_alarm_conf"]:
            risk_score = 75.0
            hazards.append("SMOKE / FIRE ALARM FREQUENCY RECOGNIZED")
            
        # RULE H: Single unverified fire flicker or medium flame
        elif fire_detected and fire_conf >= self.thresholds["fire_med"]:
            risk_score = 62.0
            hazards.append("UNVERIFIED FLAME SIGNATURE CANDIDATE (TEMPORAL EVALUATION IN PROGRESS)")
            
        # RULE I: Isolated Glass Breaking without motion
        elif audio_class == "GLASS_BREAKING" and audio_conf >= self.thresholds["glass_conf"]:
            risk_score = 58.0
            hazards.append("ISOLATED GLASS IMPACT FREQUENCY BURST")
            
        # RULE J: Heavy Smoke alone
        elif smoke_detected and smoke_conf >= self.thresholds["smoke_high"]:
            risk_score = 52.0
            hazards.append("VISUAL SMOKE OBSCURATION DETECTED")
            
        # RULE K: Loud Impact sound
        elif audio_class == "LOUD_IMPACT" and audio_conf >= 0.60:
            risk_score = 42.0
            hazards.append("SUDDEN HIGH-ENERGY ACOUSTIC IMPACT / THUD")
            
        # RULE L: Unusual Movement alone
        elif unusual_motion:
            risk_score = 38.0
            hazards.append("UNUSUAL INDOOR MOVEMENT SPIKE")
            
        # RULE M: Elevated simulated temperature or gas without fire
        elif sim_temp >= 45.0 or sim_gas >= 50.0:
            risk_score = 35.0
            hazards.append("ELEVATED ENVIRONMENTAL SIMULATION READINGS")
            
        else:
            # NORMAL baseline
            risk_score = min(20.0, motion_pct * 0.5 + (5.0 if people_count > 0 else 2.0))
            
        # Classify Level
        if risk_score >= 85.0:
            level = "CRITICAL"
            action = "IMMEDIATE EVACUATION RECOMMENDED - DISPATCHING EMERGENCY CONTACTS"
        elif risk_score >= 65.0:
            level = "HIGH RISK"
            action = "INVESTIGATE IMMEDIATELY - PREPARE FOR ESCALATION OR FALSE ALARM DISMISSAL"
        elif risk_score >= 35.0:
            level = "WARNING"
            action = "MONITOR CLOSELY - ANOMALOUS SENSOR / VISION TRANSIENT DETECTED"
        else:
            level = "NORMAL"
            action = "ENVIRONMENT SECURE - CONTINUOUS GUARDIAN MONITORING ACTIVE"
            
        return {
            "risk_level": level,
            "risk_score": round(risk_score, 1),
            "hazards": hazards,
            "evidence": evidence,
            "recommended_action": action,
            "room_name": room_name,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

risk_engine = IntelligentRiskEngine()
