"""
Acoustic Safety Hazard Classifier
Uses Librosa and Scipy spectral analysis to detect:
1. Glass Breaking (high frequency shattering transients 4kHz - 8kHz)
2. Smoke Alarm (standard 3kHz - 3.2kHz T3 pulsed frequency)
3. Fire Alarm (2.8kHz - 3.5kHz continuous siren/sweep)
4. Screaming (sustained high human harmonic pitch 900Hz - 2.5kHz with acoustic roughness)
5. Loud Impact / Thud (low-frequency impulse burst 60Hz - 350Hz)

Privacy-First: Analysis occurs entirely in volatile RAM buffers. No audio is ever written to disk.
"""
import numpy as np
import scipy.signal
import time
from typing import Dict, Tuple, Optional
from app.schemas.alert import AudioClassificationResult

try:
    import librosa
    LIBROSA_AVAILABLE = True
except Exception:
    LIBROSA_AVAILABLE = False

class AcousticHazardClassifier:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        
    def classify_audio_chunk(self, audio_data: np.ndarray) -> AudioClassificationResult:
        """
        Takes a 1D float32 audio chunk normalized between -1.0 and 1.0.
        Returns detailed hazard classification probabilities and confidence scores.
        """
        start_t = time.time()
        
        if len(audio_data) < 256:
            return AudioClassificationResult()
            
        # 1. Root Mean Square (RMS) & Decibel estimation
        rms = np.sqrt(np.mean(audio_data**2) + 1e-12)
        db_level = float(20 * np.log10(max(rms, 1e-6)) + 90) # Calibrated ambient scale 30 - 110 dB
        
        # If complete silence, return early
        if rms < 0.005:
            return AudioClassificationResult(
                ambient_db=round(db_level, 1),
                analysis_latency_ms=round((time.time() - start_t) * 1000, 1)
            )

        # 2. Fast Fourier Transform & Power Spectral Density
        fft_vals = np.abs(np.fft.rfft(audio_data))
        freqs = np.fft.rfftfreq(len(audio_data), 1.0 / self.sample_rate)
        total_energy = np.sum(fft_vals**2) + 1e-10

        # Frequency band energy ratios
        # Low: 50 - 400 Hz (Impact / Thud / Boom)
        low_mask = (freqs >= 50) & (freqs <= 400)
        low_energy = np.sum(fft_vals[low_mask]**2) / total_energy
        
        # Mid-Low (Speech): 300 - 1200 Hz
        speech_mask = (freqs >= 300) & (freqs <= 1200)
        speech_energy = np.sum(fft_vals[speech_mask]**2) / total_energy
        
        # Scream Band: 900 - 2600 Hz (High emotional distress acoustics)
        scream_mask = (freqs >= 900) & (freqs <= 2600)
        scream_energy = np.sum(fft_vals[scream_mask]**2) / total_energy
        
        # Smoke & Fire Alarm Band: 2800 - 3600 Hz (Standard piezoelectric alert sirens)
        alarm_mask = (freqs >= 2800) & (freqs <= 3600)
        alarm_energy = np.sum(fft_vals[alarm_mask]**2) / total_energy
        
        # Glass Breaking Band: 4000 - 8500 Hz (Sharp brittle shattering transients)
        glass_mask = (freqs >= 4000) & (freqs <= 8500)
        glass_energy = np.sum(fft_vals[glass_mask]**2) / total_energy

        # 3. Peak Frequency & Dominant Tones
        peak_idx = np.argmax(fft_vals)
        dominant_freq = freqs[peak_idx]

        # 4. Temporal Transient Metric (Crest Factor: Peak / RMS)
        peak_amp = np.max(np.abs(audio_data))
        crest_factor = peak_amp / (rms + 1e-6)

        # 5. Advanced Librosa / Scipy features if available
        spectral_centroid = float(np.sum(freqs * fft_vals) / (np.sum(fft_vals) + 1e-10))
        zcr = float(np.mean(np.diff(np.signbit(audio_data)) != 0))

        # --- MODEL CLASSIFICATION PROBABILITIES ---
        
        # A. GLASS BREAKING:
        # High frequency concentration (>4kHz), sharp high crest factor (> 4.5), high zero crossings
        glass_prob = 0.0
        if glass_energy > 0.28 and crest_factor > 3.8 and spectral_centroid > 3800:
            glass_prob = float(min(0.96, glass_energy * 1.8 + (crest_factor / 15.0) * 0.4))
        elif glass_energy > 0.20 and spectral_centroid > 3500:
            glass_prob = float(min(0.80, glass_energy * 1.5))
            
        # B. SMOKE ALARM (3.0kHz - 3.2kHz intense peak):
        smoke_alarm_prob = 0.0
        if 2900 <= dominant_freq <= 3350 and alarm_energy > 0.35:
            smoke_alarm_prob = float(min(0.98, alarm_energy * 1.6 + 0.2))
        elif alarm_energy > 0.45:
            smoke_alarm_prob = float(min(0.85, alarm_energy * 1.3))
            
        # C. FIRE ALARM (Broader siren 2.8kHz - 3.8kHz with high volume):
        fire_alarm_prob = 0.0
        if 2700 <= dominant_freq <= 3800 and alarm_energy > 0.30 and db_level > 65:
            fire_alarm_prob = float(min(0.97, alarm_energy * 1.5 + 0.25))
            
        # D. SCREAMING (Human distress vocal tract harmonics 900 - 2400Hz with volume surge):
        scream_prob = 0.0
        if scream_energy > 0.40 and db_level > 68 and (1000 <= spectral_centroid <= 2600):
            scream_prob = float(min(0.95, scream_energy * 1.4 + 0.2))
        elif scream_energy > 0.30 and db_level > 62:
            scream_prob = float(min(0.72, scream_energy * 1.2))

        # E. LOUD IMPACT / THUD (Heavy physical blow, fall, or door slam):
        impact_prob = 0.0
        if low_energy > 0.45 and crest_factor > 4.2 and db_level > 72:
            impact_prob = float(min(0.96, low_energy * 1.5 + (crest_factor / 12.0) * 0.3))
        elif low_energy > 0.38 and db_level > 65:
            impact_prob = float(min(0.78, low_energy * 1.2))

        # Determine primary hazard sound
        scores = {
            "Glass Breaking": glass_prob,
            "Smoke Alarm": smoke_alarm_prob,
            "Fire Alarm": fire_alarm_prob,
            "Screaming": scream_prob,
            "Loud Impact": impact_prob
        }
        
        top_sound, top_conf = max(scores.items(), key=lambda x: x[1])
        is_hazard = top_conf >= 0.55
        
        latency = round((time.time() - start_t) * 1000, 1)

        return AudioClassificationResult(
            glass_breaking=round(glass_prob, 3),
            smoke_alarm=round(smoke_alarm_prob, 3),
            fire_alarm=round(fire_alarm_prob, 3),
            screaming=round(scream_prob, 3),
            loud_impact=round(impact_prob, 3),
            speech_detected=(speech_energy > 0.35 and db_level > 45),
            ambient_db=round(db_level, 1),
            top_hazard_sound=top_sound if is_hazard else None,
            hazard_confidence=round(top_conf, 3),
            is_hazard=is_hazard,
            analysis_latency_ms=latency
        )

audio_classifier = AcousticHazardClassifier()
