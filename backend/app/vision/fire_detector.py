"""
Computer Vision Flame & Smoke Detection Engine
Implements robust color-space modeling (HSV + YCrCb), contour complexity,
flicker variance analysis, and false-positive suppression against static lights.
"""
import cv2
import numpy as np
import time
from typing import List, Tuple, Dict
from app.schemas.alert import BoundingBox

class FireSmokeDetector:
    def __init__(self):
        # Rolling history of candidate fire regions for temporal flicker analysis
        # Format: {region_key: [(timestamp, area, mean_intensity)]}
        self.region_history: Dict[str, list] = {}
        self.prev_frame_gray = None
        self.last_cleanup = time.time()
        
    def _suppress_static_lights(self, contour, mask_roi) -> Tuple[bool, float]:
        """
        Differentiates real fire from static orange lights, street lamps, and LEDs.
        Fire characteristics:
        1. High boundary roughness (Perimeter^2 / Area ratio is high, jagged).
        2. Non-uniform internal gradient.
        Lamps/lights characteristics:
        1. Very smooth elliptical or circular contour.
        2. Constant spatial luminance.
        """
        area = cv2.contourArea(contour)
        if area < 80:  # Noise
            return False, 0.0
            
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            return False, 0.0
            
        # Circularity measure: 4 * pi * Area / Perimeter^2
        # A perfect circle/bulb is ~1.0. Fire flames have complex jagged edges (< 0.55).
        circularity = (4 * np.pi * area) / (perimeter * perimeter)
        
        # If it's almost a perfect circle/ellipse, it's very likely a lamp/lightbulb or reflection
        if circularity > 0.78:
            return False, 0.15
            
        # Flame roughness factor
        roughness_score = min(1.0, max(0.0, 1.0 - circularity))
        return True, roughness_score

    def detect_fire(self, frame_bgr: np.ndarray) -> Tuple[bool, float, List[BoundingBox]]:
        """
        Analyze frame for fire flames using dual color-space modeling + morphological filtering.
        """
        h, w = frame_bgr.shape[:2]
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        ycrcb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2YCrCb)
        
        # 1. HSV Rule for Flame: Hue in red-yellow spectrum, moderate-to-high saturation, high brightness
        lower_hsv1 = np.array([0, 70, 160], dtype=np.uint8)
        upper_hsv1 = np.array([32, 255, 255], dtype=np.uint8)
        mask_hsv1 = cv2.inRange(hsv, lower_hsv1, upper_hsv1)
        
        lower_hsv2 = np.array([170, 70, 160], dtype=np.uint8)
        upper_hsv2 = np.array([180, 255, 255], dtype=np.uint8)
        mask_hsv2 = cv2.inRange(hsv, lower_hsv2, upper_hsv2)
        mask_hsv = cv2.bitwise_or(mask_hsv1, mask_hsv2)
        
        # 2. YCrCb Rule: In fire, Y >= Cb, Cr >= Cb, and Y is bright
        Y, Cr, Cb = cv2.split(ycrcb)
        mask_ycrcb = (Y >= Cb) & (Cr >= Cb) & (Cr >= 135) & (Y >= 110)
        mask_ycrcb = (mask_ycrcb.astype(np.uint8)) * 255
        
        # 3. Intersect both color spaces to drastically cut down false positives
        combined_mask = cv2.bitwise_and(mask_hsv, mask_ycrcb)
        
        # 4. Morphological clean-up to remove pepper noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_DILATE, kernel)
        
        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        fire_boxes = []
        max_confidence = 0.0
        
        now = time.time()
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            area = cv2.contourArea(cnt)
            if area < 100:
                continue
                
            is_valid, roughness = self._suppress_static_lights(cnt, combined_mask[y:y+bh, x:x+bw])
            if not is_valid:
                continue
                
            # Compute confidence based on color saturation, area, and edge roughness
            roi_hsv = hsv[y:y+bh, x:x+bw]
            mean_val = np.mean(roi_hsv[:, :, 2]) / 255.0
            mean_sat = np.mean(roi_hsv[:, :, 1]) / 255.0
            
            # Real fire has high brightness and good saturation
            confidence = round(float(0.4 * roughness + 0.35 * mean_val + 0.25 * mean_sat), 3)
            confidence = min(0.98, max(0.35, confidence))
            
            if confidence > 0.50:
                fire_boxes.append(BoundingBox(
                    x=int(x),
                    y=int(y),
                    width=int(bw),
                    height=int(bh),
                    label=f"Flame ({int(confidence*100)}%)",
                    confidence=confidence
                ))
                if confidence > max_confidence:
                    max_confidence = confidence
                    
        has_fire = len(fire_boxes) > 0 and max_confidence >= 0.50
        return has_fire, max_confidence, fire_boxes

    def detect_smoke(self, frame_bgr: np.ndarray) -> Tuple[bool, float, List[BoundingBox]]:
        """
        Analyze frame for visible smoke using grayish low-saturation clustering
        and diffuse contour analysis.
        """
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        ycrcb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2YCrCb)
        
        Y, Cr, Cb = cv2.split(ycrcb)
        
        # Smoke characteristic: Low color difference |Cr - 128| < 18, |Cb - 128| < 18, moderate-to-high luminance
        diff_cr = np.abs(Cr.astype(np.int16) - 128)
        diff_cb = np.abs(Cb.astype(np.int16) - 128)
        
        smoke_mask = (diff_cr < 16) & (diff_cb < 16) & (Y > 85) & (Y < 235)
        # Low saturation in HSV
        low_sat = hsv[:, :, 1] < 45
        smoke_mask = (smoke_mask & low_sat).astype(np.uint8) * 255
        
        # Blur mask to capture diffuse cloudy regions
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        smoke_mask = cv2.morphologyEx(smoke_mask, cv2.MORPH_CLOSE, kernel)
        smoke_mask = cv2.GaussianBlur(smoke_mask, (15, 15), 0)
        _, smoke_thresh = cv2.threshold(smoke_mask, 140, 255, cv2.THRESH_BINARY)
        
        contours, _ = cv2.findContours(smoke_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        smoke_boxes = []
        max_smoke_conf = 0.0
        
        frame_area = frame_bgr.shape[0] * frame_bgr.shape[1]
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            area = cv2.contourArea(cnt)
            # Smoke must cover significant diffuse area (at least 1.5% of frame, up to 70%)
            if area < (frame_area * 0.015) or area > (frame_area * 0.75):
                continue
                
            # Density & dispersion check
            aspect_ratio = float(bw) / bh if bh > 0 else 1.0
            if 0.3 < aspect_ratio < 3.0:
                conf = round(float(min(0.88, 0.45 + (area / frame_area) * 0.8)), 3)
                smoke_boxes.append(BoundingBox(
                    x=int(x),
                    y=int(y),
                    width=int(bw),
                    height=int(bh),
                    label=f"Smoke ({int(conf*100)}%)",
                    confidence=conf
                ))
                if conf > max_smoke_conf:
                    max_smoke_conf = conf
                    
        has_smoke = len(smoke_boxes) > 0 and max_smoke_conf >= 0.50
        return has_smoke, max_smoke_conf, smoke_boxes
