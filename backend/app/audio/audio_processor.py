"""
In-Memory Audio Stream Buffer Processor
Processes raw PCM byte chunks from browser WebSocket or WebRTC
Zero persistent file storage for 100% user privacy.
"""
import numpy as np
import base64
from app.audio.audio_classifier import audio_classifier
from app.schemas.alert import AudioClassificationResult

class AudioStreamProcessor:
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        
    def process_pcm_bytes(self, pcm_bytes: bytes) -> AudioClassificationResult:
        """
        Converts 16-bit signed PCM or 32-bit float bytes into numpy array and classifies.
        """
        try:
            # Browser audio worklet usually sends float32 or int16
            audio_data = np.frombuffer(pcm_bytes, dtype=np.float32)
            if len(audio_data) == 0:
                # Try int16
                audio_data = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            return audio_classifier.classify_audio_chunk(audio_data)
        except Exception as e:
            # Fallback
            return AudioClassificationResult()

    def process_base64_audio(self, b64_str: str) -> AudioClassificationResult:
        try:
            raw_bytes = base64.b64decode(b64_str)
            return self.process_pcm_bytes(raw_bytes)
        except Exception:
            return AudioClassificationResult()

audio_processor = AudioStreamProcessor()
