"""
Intelligent Safety Risk Engine
Performs multi-modal fusion of visual, acoustic, and environmental evidence.
Applies temporal verification windows, cross-modality reinforcement, and
computes deterministic risk levels: NORMAL, WARNING, HIGH RISK, CRITICAL.
"""
import time
from typing import List, Tuple, Dict, Any, Optional
from collections import deque
from app.config import settings
from app.schemas.alert import (
    VisualDetectionResult,
    AudioClassificationResult,
    EnvironmentalSensorData,
    UnifiedRiskState
)

class RiskEngine:
    def __init__(self):
        # Rolling temporal verification history (last 5 frames / intervals)
        self.visual_history = deque(maxlen=5)
        self.audio_history = deque(maxlen=5)
        self.sensor_history = deque(maxlen=5)
        
        self.last_alert_time: float = 0.0
        self.consecutive_threat_frames: int = 0
        self.current_risk_level: str = "NORMAL"

    def evaluate(
        self,
        visual: VisualDetectionResult,
        audio: AudioClassificationResult,
        env: EnvironmentalSensorData
    ) -> UnifiedRiskState:
        """
        Combines visual and audio evidence with environmental telemetry.
        Returns unified risk state with verified threat analysis.
        """
        self.visual_history.append(visual)
        self.audio_history.append(audio)
        self.sensor_history.append(env)
        
        active_hazards: List[str] = []
        threat_scores: List[float] = []
        
        # --- 1. VISUAL EVIDENCE ANALYSIS ---
        v_fire_hits = sum(1 for v in self.visual_history if v.has_fire)
        v_smoke_hits = sum(1 for v in self.visual_history if v.has_smoke)
        
        # Temporal verification: Fire must be observed in at least 2 consecutive frames
        # or have very high single confidence (> 0.85)
        is_fire_verified = (v_fire_hits >= 2) or (visual.fire_confidence >= 0.85)
        if visual.has_fire and is_fire_verified:
            active_hazards.append("Visible Flames")
            threat_scores.append(visual.fire_confidence * 0.90)
            
        if visual.has_smoke and (v_smoke_hits >= 2 or visual.smoke_confidence >= 0.75):
            active_hazards.append("Visible Smoke Influx")
            threat_scores.append(visual.smoke_confidence * 0.70)
            
        if visual.has_unusual_motion and visual.motion_intensity > settings.MOTION_THRESHOLD:
            active_hazards.append(f"Unusual Movement ({visual.motion_description})")
            threat_scores.append(visual.motion_intensity * 0.45)

        # --- 2. AUDIO EVIDENCE ANALYSIS ---
        if audio.glass_breaking >= settings.GLASS_BREAK_THRESHOLD:
            active_hazards.append(f"Glass Shattering Acoustic ({int(audio.glass_breaking*100)}%)")
            threat_scores.append(audio.glass_breaking * 0.85)
            
        if audio.smoke_alarm >= settings.ALARM_SOUND_THRESHOLD:
            active_hazards.append(f"Smoke Alarm Acoustic ({int(audio.smoke_alarm*100)}%)")
            threat_scores.append(audio.smoke_alarm * 0.88)
            
        if audio.fire_alarm >= settings.ALARM_SOUND_THRESHOLD:
            active_hazards.append(f"Fire Siren Siren Pattern ({int(audio.fire_alarm*100)}%)")
            threat_scores.append(audio.fire_alarm * 0.90)
            
        if audio.screaming >= settings.SCREAM_THRESHOLD:
            active_hazards.append(f"Human Distress Vocalization ({int(audio.screaming*100)}%)")
            threat_scores.append(audio.screaming * 0.85)
            
        if audio.loud_impact >= settings.IMPACT_THRESHOLD:
            active_hazards.append(f"Heavy Physical Impact ({int(audio.loud_impact*100)}%)")
            threat_scores.append(audio.loud_impact * 0.65)

        # --- 3. ENVIRONMENTAL EVIDENCE ANALYSIS (SIMULATED) ---
        if env.temperature_celsius >= settings.TEMP_CRITICAL_CELSIUS:
            active_hazards.append(f"Hazardous Temperature ({env.temperature_celsius}°C)")
            threat_scores.append(0.92)
        elif env.temperature_celsius >= settings.TEMP_WARNING_CELSIUS:
            active_hazards.append(f"Elevated Temperature ({env.temperature_celsius}°C)")
            threat_scores.append(0.50)
            
        if env.smoke_ppm >= settings.SMOKE_PPM_CRITICAL:
            active_hazards.append(f"Dangerous Smoke Density ({env.smoke_ppm} PPM)")
            threat_scores.append(0.90)
        elif env.smoke_ppm >= settings.SMOKE_PPM_WARNING:
            active_hazards.append(f"Elevated Particulates ({env.smoke_ppm} PPM)")
            threat_scores.append(0.48)
            
        if env.gas_ppm >= settings.GAS_PPM_CRITICAL:
            active_hazards.append(f"Combustible Gas Leak Surge ({env.gas_ppm} PPM)")
            threat_scores.append(0.95)
        elif env.gas_ppm >= settings.GAS_PPM_WARNING:
            active_hazards.append(f"Elevated Gas Concentration ({env.gas_ppm} PPM)")
            threat_scores.append(0.52)

        # --- 4. MULTI-MODAL REINFORCEMENT & CONVERGENCE ---
        # If both visual fire and acoustic alarm or smoke surge occur -> Emergency Convergence multiplier!
        has_fire_evidence = ("Visible Flames" in active_hazards) or ("Visible Smoke Influx" in active_hazards)
        has_alarm_evidence = any("Alarm" in h for h in active_hazards)
        has_gas_evidence = any("Gas" in h for h in active_hazards)
        has_glass_evidence = any("Glass" in h for h in active_hazards)
        has_scream_evidence = any("Distress" in h for h in active_hazards)
        
        multi_modal_multiplier = 1.0
        if has_fire_evidence and (has_alarm_evidence or env.status == "CRITICAL"):
            multi_modal_multiplier = 1.35  # Fire confirmed by multiple sensors
        if has_glass_evidence and (has_scream_evidence or visual.has_unusual_motion):
            multi_modal_multiplier = 1.30  # Break-in / assault convergence
        if has_gas_evidence and has_fire_evidence:
            multi_modal_multiplier = 1.40  # Catastrophic explosion risk

        # Compute raw combined score
        if not threat_scores:
            combined_score = 0.0
        else:
            # Dominant threat plus bounded contribution from supporting hazards
            sorted_threats = sorted(threat_scores, reverse=True)
            primary = sorted_threats[0]
            secondary_boost = sum(sorted_threats[1:]) * 0.15
            combined_score = min(1.0, (primary + secondary_boost) * multi_modal_multiplier)
            
        # Temporal verification tracking
        if combined_score >= 0.40:
            self.consecutive_threat_frames += 1
        else:
            self.consecutive_threat_frames = max(0, self.consecutive_threat_frames - 1)
            
        verified = self.consecutive_threat_frames >= 2 or combined_score >= 0.85

        # Determine Risk Level
        if combined_score >= 0.78 and verified:
            risk_level = "CRITICAL"
            recommendation = "EMERGENCY: Immediate evacuation recommended! Life safety hazard confirmed. Automated alerts dispatched."
        elif combined_score >= 0.52:
            risk_level = "HIGH RISK"
            recommendation = "HIGH THREAT DETECTED: Operator verification urgently required. Prepare room suppression / contact authorities."
        elif combined_score >= 0.28:
            risk_level = "WARNING"
            recommendation = "ADVISORY: Unusual sensory anomaly detected. Inspect room telemetry and camera feed."
        else:
            risk_level = "NORMAL"
            recommendation = "Environment secure. Autonomous surveillance active. All visual, acoustic, and sensor baselines stable."
            
        self.current_risk_level = risk_level
        primary_threat = active_hazards[0] if active_hazards else None

        return UnifiedRiskState(
            risk_level=risk_level,
            combined_score=round(combined_score, 3),
            active_hazards=active_hazards,
            primary_threat=primary_threat,
            visual_evidence=visual,
            audio_evidence=audio,
            environmental_evidence=env,
            temporal_stability_frames=self.consecutive_threat_frames,
            verified=verified,
            recommendation=recommendation,
            room_id=settings.DEFAULT_ROOM_ID,
            room_name=settings.DEFAULT_ROOM_NAME
        )

risk_engine = RiskEngine()
