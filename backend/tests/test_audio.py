"""
Unit and Integration Tests for Audio Processing & Acoustic Classification
"""
import numpy as np
from app.audio.audio_classifier import audio_classifier
from app.audio.audio_processor import audio_processor

def test_glass_breaking_detection():
    # Synthesize glass break acoustic (high frequency transient + noise burst)
    sr = 16000
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    sig = (0.5 * np.sin(2 * np.pi * 5200 * t) + np.random.normal(0, 0.2, len(t))) * np.exp(-t * 22)
    sig[0:30] *= 4.0
    audio = (sig / np.max(np.abs(sig))).astype(np.float32)
    
    res = audio_classifier.classify_audio_chunk(audio)
    assert res.glass_breaking > 0.40
    assert res.top_hazard_sound == "Glass Breaking"

def test_smoke_alarm_detection():
    # Synthesize smoke alarm (3100Hz pure tone)
    sr = 16000
    t = np.linspace(0, 0.8, int(sr * 0.8), endpoint=False)
    tone = np.sin(2 * np.pi * 3120 * t).astype(np.float32)
    
    res = audio_classifier.classify_audio_chunk(tone)
    assert res.smoke_alarm > 0.50 or res.fire_alarm > 0.40

def test_silence_handling():
    silence = np.zeros(4000, dtype=np.float32)
    res = audio_classifier.classify_audio_chunk(silence)
    assert res.is_hazard is False
    assert res.ambient_db < 40.0

if __name__ == "__main__":
    test_glass_breaking_detection()
    test_smoke_alarm_detection()
    test_silence_handling()
    print("All audio classification tests passed successfully!")
