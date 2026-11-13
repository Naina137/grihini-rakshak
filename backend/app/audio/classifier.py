import numpy as np
import base64
import io
import time
from typing import Dict, Any, List, Optional
from .features import audio_feature_extractor

class AcousticClassifier:
    """
    Classifies indoor acoustic hazards:
    - Glass breaking
    - Smoke alarm / Fire alarm
    - Screaming / Human distress
    - Loud impacts / thuds
    - Ambient room noise
    """
    CLASSES = ["AMBIENT", "SMOKE_ALARM", "FIRE_ALARM", "GLASS_BREAKING", "SCREAMING", "LOUD_IMPACT"]

    def __init__(self):
        self.history = []

    def decode_audio_chunk(self, b64_str: str, sample_rate: int = 22050) -> np.ndarray:
        """Decodes base64 raw float32 or int16 PCM array into numpy float32 (-1.0 to 1.0)."""
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            raw_bytes = base64.b64decode(b64_str)
            
            # Check if float32 or int16
            if len(raw_bytes) % 4 == 0:
                audio_np = np.frombuffer(raw_bytes, dtype=np.float32)
            else:
                audio_np = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                
            return audio_np
        except Exception as e:
            print(f"[AcousticClassifier] Audio decode error: {e}")
            return np.zeros(1024, dtype=np.float32)

    def classify_audio(self, y: np.ndarray, sr: int = 22050) -> Dict[str, Any]:
        feats = audio_feature_extractor.extract(y, sr)
        
        if feats.get("is_silent", True) or feats.get("rms", 0) < 0.015:
            return {
                "primary_class": "AMBIENT",
                "confidence": 0.98,
                "is_hazard": False,
                "scores": {c: 0.01 if c != "AMBIENT" else 0.98 for c in self.CLASSES},
                "features": feats,
                "db_spl": round(20 * np.log10(max(1e-5, feats["rms"])) + 90, 1),
                "waveform_summary": self._generate_waveform_points(y)
            }
            
        scores = {c: 0.05 for c in self.CLASSES}
        
        # 1. Smoke / Fire Alarm Detection
        # Standard UL 217 smoke alarm is ~3100 Hz pure tone with high peak-to-noise ratio
        dom_freq = feats["dominant_frequency"]
        alarm_ratio = feats["alarm_band_ratio"]
        flatness = feats["spectral_flatness"]
        
        is_alarm_freq = (2900 <= dom_freq <= 3400)
        if is_alarm_freq and (alarm_ratio >= 0.25 or flatness < 0.08):
            conf = min(0.98, 0.45 + (alarm_ratio * 1.5) + (0.3 if flatness < 0.05 else 0.1))
            scores["SMOKE_ALARM"] = float(conf)
            scores["FIRE_ALARM"] = float(conf * 0.92)
            
        # 2. Glass Breaking Detection
        # High spectral centroid > 4500Hz, high rolloff > 7000Hz, high ZCR
        centroid = feats["spectral_centroid"]
        rolloff = feats["spectral_rolloff"]
        zcr = feats["zero_crossing_rate"]
        high_ratio = feats["high_band_ratio"]
        
        if centroid >= 4200 and rolloff >= 6500 and (zcr >= 0.12 or high_ratio >= 0.30):
            conf = min(0.97, 0.40 + (high_ratio * 1.2) + (zcr * 2.0))
            scores["GLASS_BREAKING"] = float(conf)
            
        # 3. Screaming / Distress Detection
        # Strong energy in 1200-3200Hz human formant band, high RMS, pitch variability
        scream_ratio = feats["scream_band_ratio"]
        rms = feats["rms"]
        if 1100 <= dom_freq <= 3200 and scream_ratio >= 0.35 and rms >= 0.12:
            conf = min(0.95, 0.35 + (scream_ratio * 1.0) + (rms * 1.5))
            scores["SCREAMING"] = float(conf)
            
        # 4. Loud Impact Detection
        # Heavy low band (<450Hz), sudden peak amplitude
        low_ratio = feats["low_band_ratio"]
        peak = feats["peak_amplitude"]
        if low_ratio >= 0.45 and (peak >= 0.35 or rms >= 0.20):
            conf = min(0.96, 0.40 + (low_ratio * 0.9) + (peak * 0.5))
            scores["LOUD_IMPACT"] = float(conf)
            
        # 5. Normalize scores with softmax or argmax selection
        best_class = max(scores, key=scores.get)
        best_conf = scores[best_class]
        
        if best_conf < 0.40:
            best_class = "AMBIENT"
            best_conf = 0.85
            scores["AMBIENT"] = 0.85
            
        # Normalize other classes
        total_s = sum(scores.values())
        norm_scores = {k: round(v / total_s, 3) for k, v in scores.items()}
        
        db_spl = round(20 * np.log10(max(1e-5, feats["rms"])) + 90, 1)
        
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
        """Subsamples audio into normalized 0.0 - 1.0 points for frontend audio canvas."""
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
        """Synthesizes high-fidelity acoustic signatures for testing and lab validation."""
        n_samples = int(duration_sec * sr)
        t = np.linspace(0, duration_sec, n_samples, endpoint=False)
        
        if hazard_type == "SMOKE_ALARM" or hazard_type == "FIRE_ALARM":
            # T3 Fire alarm pattern: 3100Hz pure tone burst with harmonic at 6200Hz
            carrier = np.sin(2 * np.pi * 3100 * t) + 0.25 * np.sin(2 * np.pi * 6200 * t)
            # 3 beeps (0.5s on, 0.5s off)
            envelope = np.where((t % 0.5) < 0.35, 0.8, 0.0)
            return (carrier * envelope).astype(np.float32)
            
        elif hazard_type == "GLASS_BREAKING":
            # Sharp resonant high frequencies (5000Hz, 7200Hz, 8800Hz) with fast exponential decay + burst noise
            decay = np.exp(-t * 25.0)
            tones = (
                0.4 * np.sin(2 * np.pi * 5200 * t) +
                0.3 * np.sin(2 * np.pi * 7400 * t) +
                0.3 * np.sin(2 * np.pi * 8900 * t)
            )
            noise = np.random.normal(0, 0.3, n_samples)
            return ((tones + noise) * decay).astype(np.float32)
            
        elif hazard_type == "SCREAMING":
            # Human distress formant resonance: fundamental ~600Hz, strong formants at 1800Hz, 2600Hz
            vibrato = 1.0 + 0.08 * np.sin(2 * np.pi * 7 * t)
            f0 = 650 * vibrato
            voice = (
                0.5 * np.sin(2 * np.pi * f0 * t) +
                0.6 * np.sin(2 * np.pi * (2.8 * f0) * t) +
                0.4 * np.sin(2 * np.pi * (4.1 * f0) * t)
            )
            envelope = np.minimum(t * 10, 1.0) * np.exp(-t * 0.5)
            return (voice * envelope * 0.7).astype(np.float32)
            
        elif hazard_type == "LOUD_IMPACT":
            # Low-frequency thud (<120Hz) with rapid decay
            decay = np.exp(-t * 30.0)
            thud = np.sin(2 * np.pi * 85 * t) + 0.5 * np.sin(2 * np.pi * 140 * t)
            return (thud * decay * 0.9).astype(np.float32)
            
        else: # AMBIENT
            # Mild low pink noise
            return (np.random.normal(0, 0.015, n_samples)).astype(np.float32)

acoustic_classifier = AcousticClassifier()
