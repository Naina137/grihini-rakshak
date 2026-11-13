import numpy as np
import base64
import io
import time
from typing import Dict, Any, List, Optional
from .features import audio_feature_extractor

class AcousticClassifier:
    """
    Classifies indoor acoustic hazards:
    - Glass breaking (high-frequency resonant shatter with transient impact)
    - Smoke alarm / Fire alarm (UL 217 / NFPA 72 T-3 3100Hz pure tone)
    - Screaming / Human distress (1200-3200Hz human formant vocalization)
    - Loud impacts / thuds (<450Hz low-frequency impulse)
    - Ambient room noise
    """
    CLASSES = ["AMBIENT", "SMOKE_ALARM", "FIRE_ALARM", "GLASS_BREAKING", "SCREAMING", "LOUD_IMPACT"]

    def __init__(self):
        self.history = []

    def decode_audio_chunk(self, b64_str: str, sample_rate: int = 22050) -> np.ndarray:
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            raw_bytes = base64.b64decode(b64_str)
            if len(raw_bytes) % 4 == 0:
                audio_np = np.frombuffer(raw_bytes, dtype=np.float32)
            else:
                audio_np = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            return audio_np
        except Exception as e:
            return np.zeros(1024, dtype=np.float32)

    def classify_audio(self, y: np.ndarray, sr: int = 22050) -> Dict[str, Any]:
        feats = audio_feature_extractor.extract(y, sr)
        
        # 1. Silence or Normal Low Room Volume is ALWAYS AMBIENT
        # Glass shatter, screaming, alarms, and impacts are LOUD (> 0.06 RMS, peak > 0.15)
        rms = feats.get("rms", 0.0)
        peak = feats.get("peak_amplitude", 0.0)
        
        if feats.get("is_silent", True) or rms < 0.04 or peak < 0.08:
            return {
                "primary_class": "AMBIENT",
                "confidence": 0.98,
                "is_hazard": False,
                "scores": {c: 0.01 if c != "AMBIENT" else 0.98 for c in self.CLASSES},
                "features": feats,
                "db_spl": round(20 * np.log10(max(1e-5, rms)) + 90, 1),
                "waveform_summary": self._generate_waveform_points(y)
            }
            
        scores = {c: 0.02 for c in self.CLASSES}
        
        dom_freq = feats["dominant_frequency"]
        alarm_ratio = feats["alarm_band_ratio"]
        flatness = feats["spectral_flatness"]
        centroid = feats["spectral_centroid"]
        rolloff = feats["spectral_rolloff"]
        zcr = feats["zero_crossing_rate"]
        high_ratio = feats["high_band_ratio"]
        low_ratio = feats["low_band_ratio"]
        scream_ratio = feats["scream_band_ratio"]

        # 2. Smoke / Fire Alarm Detection
        # Standard UL 217 smoke alarm is ~3100 Hz pure tone with high peak-to-noise ratio
        is_alarm_freq = (2900 <= dom_freq <= 3400)
        if is_alarm_freq and (alarm_ratio >= 0.25 or flatness < 0.08) and rms >= 0.06:
            conf = min(0.98, 0.50 + (alarm_ratio * 1.5) + (0.3 if flatness < 0.05 else 0.1))
            scores["SMOKE_ALARM"] = float(conf)
            scores["FIRE_ALARM"] = float(conf * 0.92)
            
        # 3. Glass Breaking Detection
        # Real glass breaking requires:
        # - High energy transient (peak >= 0.18, rms >= 0.05)
        # - High spectral centroid (>4800Hz) & rolloff (>7200Hz)
        # - NOT uniform white noise (flatness must not be excessively high like pure hiss)
        # - Substantial high band ratio
        is_real_glass_transient = (
            peak >= 0.18 and rms >= 0.05 and
            centroid >= 4800 and rolloff >= 7000 and
            high_ratio >= 0.35 and zcr >= 0.14 and
            flatness <= 0.45  # Rejects pure background white noise / fan hiss
        )
        if is_real_glass_transient:
            conf = min(0.96, 0.45 + (high_ratio * 0.8) + (peak * 0.5))
            scores["GLASS_BREAKING"] = float(conf)
            
        # 4. Screaming / Distress Detection
        # Strong energy in 1200-3200Hz human formant band, high RMS
        if 1100 <= dom_freq <= 3200 and scream_ratio >= 0.38 and rms >= 0.12 and peak >= 0.25:
            conf = min(0.95, 0.35 + (scream_ratio * 1.0) + (rms * 1.5))
            scores["SCREAMING"] = float(conf)
            
        # 5. Loud Impact Detection
        # Heavy low band (<450Hz), sudden peak amplitude
        if low_ratio >= 0.48 and (peak >= 0.35 or rms >= 0.18):
            conf = min(0.96, 0.45 + (low_ratio * 0.8) + (peak * 0.5))
            scores["LOUD_IMPACT"] = float(conf)
            
        # 6. Normalize and decide
        best_class = max(scores, key=scores.get)
        best_conf = scores[best_class]
        
        # If no hazard exceeds 0.50 confidence, it is AMBIENT room noise
        if best_conf < 0.50:
            best_class = "AMBIENT"
            best_conf = 0.95
            scores["AMBIENT"] = 0.95
            
        total_s = sum(scores.values())
        norm_scores = {k: round(v / total_s, 3) for k, v in scores.items()}
        db_spl = round(20 * np.log10(max(1e-5, rms)) + 90, 1)
        
        return {
            "primary_class": best_class,
            "confidence": round(best_conf, 3),
            "is_hazard": best_class != "AMBIENT",
            "scores": norm_scores,
            "features": feats,
            "db_spl": db_spl,
            "waveform_summary": self._generate_waveform_points(y)
        }

    def _generate_waveform_points(self, y: np.ndarray, points: int = 32) -> List[float]:
        if len(y) == 0:
            return [0.0] * points
        chunk_size = max(1, len(y) // points)
        res = []
        for i in range(points):
            seg = y[i*chunk_size : (i+1)*chunk_size]
            if len(seg) > 0:
                res.append(round(float(np.max(np.abs(seg))), 3))
            else:
                res.append(0.0)
        return res

    def synthesize_test_signal(self, hazard_type: str, duration_sec: float = 1.0, sr: int = 22050) -> np.ndarray:
        n_samples = int(duration_sec * sr)
        t = np.linspace(0, duration_sec, n_samples, endpoint=False)
        
        if hazard_type == "SMOKE_ALARM" or hazard_type == "FIRE_ALARM":
            carrier = np.sin(2 * np.pi * 3100 * t) + 0.25 * np.sin(2 * np.pi * 6200 * t)
            envelope = np.where((t % 0.5) < 0.35, 0.85, 0.0)
            return (carrier * envelope).astype(np.float32)
            
        elif hazard_type == "GLASS_BREAKING":
            decay = np.exp(-t * 22.0)
            tones = (
                0.55 * np.sin(2 * np.pi * 5200 * t) +
                0.45 * np.sin(2 * np.pi * 7400 * t) +
                0.35 * np.sin(2 * np.pi * 8900 * t)
            )
            # Transient sharp impulse
            impulse = np.zeros(n_samples)
            impulse[:int(sr * 0.05)] = 0.4
            return ((tones + impulse) * decay).astype(np.float32)
            
        elif hazard_type == "SCREAMING":
            vibrato = 1.0 + 0.08 * np.sin(2 * np.pi * 7 * t)
            f0 = 650 * vibrato
            voice = (
                0.5 * np.sin(2 * np.pi * f0 * t) +
                0.6 * np.sin(2 * np.pi * (2.8 * f0) * t) +
                0.4 * np.sin(2 * np.pi * (4.1 * f0) * t)
            )
            envelope = np.minimum(t * 10, 1.0) * np.exp(-t * 0.5)
            return (voice * envelope * 0.8).astype(np.float32)
            
        elif hazard_type == "LOUD_IMPACT":
            decay = np.exp(-t * 30.0)
            thud = np.sin(2 * np.pi * 85 * t) + 0.5 * np.sin(2 * np.pi * 140 * t)
            return (thud * decay * 0.95).astype(np.float32)
            
        else: # AMBIENT / Quiet room
            # Very soft low ambient room hum (< 0.003 RMS)
            return (np.sin(2 * np.pi * 60 * t) * 0.003 + np.random.normal(0, 0.002, n_samples)).astype(np.float32)

acoustic_classifier = AcousticClassifier()
