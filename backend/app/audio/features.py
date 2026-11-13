import numpy as np
from typing import Dict, Any

class AudioFeatureExtractor:
    """
    Extracts acoustic features from PCM audio arrays using NumPy and SciPy.
    Runs 100% in-memory with zero binary DLL dependencies, ensuring full immunity
    from OS AppLocker/WDAC restrictions.
    """
    def __init__(self, target_sr: int = 22050):
        self.target_sr = target_sr

    def extract(self, y: np.ndarray, sr: int = 22050) -> Dict[str, Any]:
        if y.ndim > 1:
            y = np.mean(y, axis=1)
        y = y.astype(np.float32)
        
        # Simple decimation or interpolation if sample rate differs
        if sr != self.target_sr and len(y) > 0:
            step = float(sr) / float(self.target_sr)
            indices = np.arange(0, len(y), step).astype(int)
            indices = indices[indices < len(y)]
            y = y[indices]
            sr = self.target_sr
            
        n_samples = len(y)
        if n_samples < 256:
            return {
                "rms": 0.0,
                "peak_amplitude": 0.0,
                "spectral_centroid": 0.0,
                "spectral_rolloff": 0.0,
                "zero_crossing_rate": 0.0,
                "spectral_flatness": 0.0,
                "dominant_frequency": 0.0,
                "alarm_band_ratio": 0.0,
                "high_band_ratio": 0.0,
                "low_band_ratio": 0.0,
                "scream_band_ratio": 0.0,
                "is_silent": True
            }
            
        # 1. RMS Energy & Peak
        rms = float(np.sqrt(np.mean(y**2)))
        peak_amp = float(np.max(np.abs(y)))
        
        if rms < 1e-4:
            return {
                "rms": round(rms, 4),
                "peak_amplitude": round(peak_amp, 4),
                "spectral_centroid": 0.0,
                "spectral_rolloff": 0.0,
                "zero_crossing_rate": 0.0,
                "spectral_flatness": 0.0,
                "dominant_frequency": 0.0,
                "alarm_band_ratio": 0.0,
                "high_band_ratio": 0.0,
                "low_band_ratio": 0.0,
                "scream_band_ratio": 0.0,
                "is_silent": True
            }
            
        # 2. Zero Crossing Rate
        zero_crossings = np.sum(np.abs(np.diff(np.signbit(y))))
        zcr = float(zero_crossings / (2.0 * n_samples))
        
        # 3. Windowed FFT
        window = np.hanning(n_samples)
        fft_vals = np.abs(np.fft.rfft(y * window))
        freqs = np.fft.rfftfreq(n_samples, 1.0 / sr)
        
        total_energy = float(np.sum(fft_vals) + 1e-7)
        
        # 4. Spectral Centroid
        centroid = float(np.sum(freqs * fft_vals) / total_energy)
        
        # 5. Spectral Rolloff (85% energy frequency)
        cum_energy = np.cumsum(fft_vals)
        threshold_85 = 0.85 * total_energy
        rolloff_idx = np.searchsorted(cum_energy, threshold_85)
        rolloff = float(freqs[min(rolloff_idx, len(freqs) - 1)])
        
        # 6. Spectral Flatness (Wiener entropy)
        power_spec = fft_vals**2 + 1e-9
        log_mean = float(np.mean(np.log(power_spec)))
        geom_mean = np.exp(log_mean)
        arith_mean = float(np.mean(power_spec))
        flatness = float(np.clip(geom_mean / (arith_mean + 1e-9), 0.0, 1.0))
        
        # 7. Band Energy Ratios
        alarm_mask = (freqs >= 2850) & (freqs <= 3450)
        alarm_band_ratio = float(np.sum(fft_vals[alarm_mask])) / total_energy
        
        high_mask = (freqs >= 4500)
        high_band_ratio = float(np.sum(fft_vals[high_mask])) / total_energy
        
        low_mask = (freqs <= 450)
        low_band_ratio = float(np.sum(fft_vals[low_mask])) / total_energy
        
        scream_mask = (freqs >= 1200) & (freqs <= 3200)
        scream_band_ratio = float(np.sum(fft_vals[scream_mask])) / total_energy
        
        # 8. Dominant Frequency
        peak_idx = int(np.argmax(fft_vals))
        dominant_freq = float(freqs[peak_idx])
        
        return {
            "rms": round(rms, 4),
            "peak_amplitude": round(peak_amp, 4),
            "spectral_centroid": round(centroid, 1),
            "spectral_rolloff": round(rolloff, 1),
            "zero_crossing_rate": round(zcr, 4),
            "spectral_flatness": round(flatness, 4),
            "dominant_frequency": round(dominant_freq, 1),
            "alarm_band_ratio": round(alarm_band_ratio, 4),
            "high_band_ratio": round(high_band_ratio, 4),
            "low_band_ratio": round(low_band_ratio, 4),
            "scream_band_ratio": round(scream_band_ratio, 4),
            "is_silent": False
        }

audio_feature_extractor = AudioFeatureExtractor()
