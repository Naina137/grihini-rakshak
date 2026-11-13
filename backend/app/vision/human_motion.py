import cv2
import numpy as np
from typing import Dict, Any, List

class HumanMotionDetector:
    """
    Advanced Indoor Human Presence and Motion Detection Engine.
    Detects occupants using:
    1. Human Skin Locus & Upper-Body Geometric Clustering (Face/Shoulder/Torso profile)
    2. Dynamic MOG2 Adaptive Foreground Subtraction
    3. Motion Velocity and Agitation Spike Tracking
    """
    def __init__(self):
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=180, varThreshold=30, detectShadows=True
        )
        self.prev_motion_area = 0.0

    def detect_people_and_motion(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        h, w = bgr_frame.shape[:2]
        total_pixels = h * w
        
        # 1. Skin locus + Torso presence detection
        ycrcb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2YCrCb)
        b, g, r = cv2.split(bgr_frame)
        Y, Cr, Cb = cv2.split(ycrcb)
        
        # Universal human skin chromaticity
        skin_mask = (
            (Cr >= 130) & (Cr <= 178) &
            (Cb >= 78) & (Cb <= 138) &
            (r > g) & (g > b) &
            (Y >= 60) & (Y <= 235)
        ).astype(np.uint8) * 255
        
        # Morphological close to join face and upper chest/hands
        kernel_face = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        skin_cluster = cv2.morphologyEx(skin_mask, cv2.MORPH_CLOSE, kernel_face)
        skin_cluster = cv2.dilate(skin_cluster, kernel_face, iterations=2)
        
        skin_contours, _ = cv2.findContours(skin_cluster, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        people_boxes = []
        for cnt in skin_contours:
            area = cv2.contourArea(cnt)
            # Require minimum head/face size (at least 0.8% of screen)
            if area < (0.008 * total_pixels):
                continue
                
            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect_ratio = float(bh) / float(bw + 1e-5)
            
            # Head/face/torso typically has aspect ratio between 0.65 and 2.5
            if 0.6 <= aspect_ratio <= 2.8 and bh >= 0.10 * h:
                # Expand box slightly to encompass upper body / shoulders
                exp_x = max(0, int(x - bw * 0.25))
                exp_y = max(0, int(y - bh * 0.15))
                exp_w = min(w - exp_x, int(bw * 1.5))
                exp_h = min(h - exp_y, int(bh * 1.8))
                
                conf = float(np.clip(0.75 + (area / total_pixels) * 2.0, 0.78, 0.96))
                people_boxes.append({
                    "x": exp_x,
                    "y": exp_y,
                    "width": exp_w,
                    "height": exp_h,
                    "confidence": round(conf, 2),
                    "label": "OCCUPANT"
                })
                
        # 2. Background subtraction for active movement
        fg_mask = self.bg_subtractor.apply(bgr_frame)
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_clean)
        cleaned = cv2.dilate(cleaned, kernel_clean, iterations=2)
        
        motion_contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        motion_boxes = []
        total_motion_pixels = 0
        
        for cnt in motion_contours:
            area = cv2.contourArea(cnt)
            if area < 500:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            total_motion_pixels += area
            
            # If large moving vertical blob and not already captured by skin detector, also count as occupant
            aspect_ratio = float(bh) / float(bw + 1e-5)
            if len(people_boxes) == 0 and 1.2 <= aspect_ratio <= 3.8 and bh >= 0.25 * h and area >= 0.03 * total_pixels:
                people_boxes.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(bw),
                    "height": int(bh),
                    "confidence": 0.82,
                    "label": "OCCUPANT"
                })
            else:
                motion_boxes.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(bw),
                    "height": int(bh),
                    "area": int(area),
                    "label": "MOTION"
                })
                
        motion_pct = round((total_motion_pixels / total_pixels) * 100, 2)
        motion_score = float(np.clip(motion_pct / 15.0, 0.0, 1.0))
        
        delta_motion = abs(motion_pct - self.prev_motion_area)
        self.prev_motion_area = motion_pct
        unusual_movement = (delta_motion >= 12.0 or motion_pct >= 28.0)
        
        return {
            "people": {
                "count": len(people_boxes),
                "detected": len(people_boxes) > 0,
                "boxes": people_boxes
            },
            "motion": {
                "motion_detected": motion_pct >= 1.5,
                "motion_pct": motion_pct,
                "motion_score": round(motion_score, 3),
                "unusual_movement": unusual_movement,
                "boxes": motion_boxes
            }
        }
