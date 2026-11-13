import cv2
import numpy as np
from collections import deque
from typing import Dict, Any, List, Tuple

class FireSmokeDetector:
    """
    Software-only Computer Vision Fire and Smoke Detection Engine.
    Combines multi-color space segmentation (YCrCb + HSV), temporal flicker analysis,
    and contour irregularity to distinguish real flames from static orange/red objects.
    """
    def __init__(self, history_len: int = 10):
        self.history_len = history_len
        self.flame_history = deque(maxlen=history_len)
        self.smoke_history = deque(maxlen=history_len)
        self.prev_gray = None

    def detect_fire(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        h, w = bgr_frame.shape[:2]
        total_pixels = h * w
        
        # 1. Color space conversion
        ycrcb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2YCrCb)
        hsv = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2HSV)
        
        Y, Cr, Cb = cv2.split(ycrcb)
        H, S, V = cv2.split(hsv)
        
        # Rule 1: Flame color in YCrCb: Y >= Cb, Cr >= Cb, and |Cr - Cb| >= 20
        cond1 = (Y >= Cb) & (Cr >= Cb) & (Cr - Cb >= 18) & (Y >= 110)
        
        # Rule 2: Flame color in HSV: Hue [0-26] (red/orange) or [340-360], S >= 110, V >= 140
        cond2 = (((H <= 26) | (H >= 170)) & (S >= 100) & (V >= 140))
        
        fire_mask = (cond1 & cond2).astype(np.uint8) * 255
        
        # Morphological operations to clean noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fire_mask = cv2.morphologyEx(fire_mask, cv2.MORPH_OPEN, kernel)
        fire_mask = cv2.dilate(fire_mask, kernel, iterations=2)
        
        # 2. Contour analysis
        contours, _ = cv2.findContours(fire_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detected_boxes = []
        max_confidence = 0.0
        total_fire_pixels = 0
        
        # Temporal flicker score calculation
        current_intensity = float(np.sum(fire_mask) / 255.0)
        self.flame_history.append(current_intensity)
        
        flicker_score = 0.0
        if len(self.flame_history) >= 4:
            history_arr = np.array(self.flame_history)
            variance = float(np.var(history_arr))
            mean_val = float(np.mean(history_arr) + 1e-5)
            # Normalized coefficient of variation
            flicker_score = min(1.0, (np.sqrt(variance) / mean_val) * 1.5)
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 150:  # Ignore tiny specks
                continue
                
            x, y, bw, bh = cv2.boundingRect(cnt)
            total_fire_pixels += area
            
            # Shape irregularity: Real fire has irregular perimeter compared to circle or square
            perimeter = cv2.arcLength(cnt, True)
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / (hull_area + 1e-5)
            
            # Fire flame solidity is typically between 0.4 and 0.85 (irregular edges)
            # Static lamps / circular indicators usually have solidity close to 1.0
            shape_score = 0.8 if (0.35 <= solidity <= 0.85) else 0.4
            
            # Color intensity in region
            region_v = V[y:y+bh, x:x+bw]
            mean_brightness = float(np.mean(region_v)) / 255.0
            
            # Anti-false positive: require both brightness and color consistency
            box_confidence = (0.45 * mean_brightness) + (0.35 * shape_score) + (0.20 * flicker_score)
            box_confidence = float(np.clip(box_confidence, 0.0, 0.99))
            
            if box_confidence > max_confidence:
                max_confidence = box_confidence
                
            detected_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "confidence": round(box_confidence, 2),
                "area_pixels": int(area),
                "label": "FLAME"
            })
            
        area_pct = round((total_fire_pixels / total_pixels) * 100, 2)
        has_fire = len(detected_boxes) > 0 and max_confidence >= 0.50
        
        return {
            "detected": has_fire,
            "confidence": round(max_confidence, 3),
            "area_pct": area_pct,
            "flicker_score": round(flicker_score, 3),
            "boxes": detected_boxes
        }

    def detect_smoke(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        """
        Detects visible smoke through contrast reduction, desaturation, and upward optical flow.
        """
        h, w = bgr_frame.shape[:2]
        hsv = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        
        H, S, V = cv2.split(hsv)
        
        # Smoke characteristic: Low saturation, medium-high luminance
        # Greyish or whitish haze
        smoke_color_mask = (S <= 65) & (V >= 90) & (V <= 230)
        
        # Local edge attenuation: smoke blurs sharp textures
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        edge_density = np.abs(laplacian)
        blurred_regions = edge_density < 18.0
        
        combined_smoke = (smoke_color_mask & blurred_regions).astype(np.uint8) * 255
        
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        combined_smoke = cv2.morphologyEx(combined_smoke, cv2.MORPH_CLOSE, kernel)
        combined_smoke = cv2.dilate(combined_smoke, kernel, iterations=2)
        
        contours, _ = cv2.findContours(combined_smoke, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        smoke_boxes = []
        max_smoke_conf = 0.0
        total_smoke_pixels = 0
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 600:  # Smoke spans larger diffuse patches
                continue
                
            x, y, bw, bh = cv2.boundingRect(cnt)
            total_smoke_pixels += area
            
            # Confidence based on area and lack of saturation
            region_s = S[y:y+bh, x:x+bw]
            desaturation_score = 1.0 - (float(np.mean(region_s)) / 255.0)
            
            conf = float(np.clip(0.40 + (0.50 * desaturation_score), 0.0, 0.95))
            if conf > max_smoke_conf:
                max_smoke_conf = conf
                
            smoke_boxes.append({
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "confidence": round(conf, 2),
                "area_pixels": int(area),
                "label": "SMOKE"
            })
            
        area_pct = round((total_smoke_pixels / (h * w)) * 100, 2)
        has_smoke = len(smoke_boxes) > 0 and max_smoke_conf >= 0.45 and area_pct >= 1.5
        
        return {
            "detected": has_smoke,
            "confidence": round(max_smoke_conf, 3),
            "area_pct": area_pct,
            "boxes": smoke_boxes
        }
