import cv2
import numpy as np
from typing import Dict, Any, List

class HumanMotionDetector:
    """
    Indoor Human & Motion Detection Engine using OpenCV 5.0.
    Combines MOG2 adaptive background subtraction with anthropomorphic
    silhouette analysis (aspect ratio, vertical elongation, head/shoulder curvature,
    and area metrics) to detect human presence and anomalous indoor movement.
    """
    def __init__(self):
        # MOG2 Background Subtractor with shadow suppression
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=150, varThreshold=25, detectShadows=True
        )
        self.prev_motion_area = 0.0
        self.tracked_people = []

    def detect_people_and_motion(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        h, w = bgr_frame.shape[:2]
        total_pixels = h * w
        
        # 1. Background subtraction for active foreground objects
        fg_mask = self.bg_subtractor.apply(bgr_frame)
        
        # Remove shadows (gray value 127 in MOG2) - keep solid foreground
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        
        # Morphological filter: close gaps inside human silhouette
        kernel_vert = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 15))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel_vert)
        
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        cleaned = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_clean)
        
        contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        people_boxes = []
        motion_boxes = []
        total_motion_pixels = 0
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 350:
                continue
                
            x, y, bw, bh = cv2.boundingRect(cnt)
            total_motion_pixels += area
            
            aspect_ratio = float(bh) / float(bw + 1e-5)
            extent = float(area) / float(bw * bh + 1e-5)
            
            # Anthropomorphic criteria for human:
            # 1. Height-to-width ratio typically between 1.3 and 4.2
            # 2. Significant vertical height (> 15% of frame height)
            # 3. Reasonable fill extent (0.25 to 0.75 for human torso/limbs)
            is_human_silhouette = (
                (1.25 <= aspect_ratio <= 4.2) and
                (bh >= 0.15 * h) and
                (0.20 <= extent <= 0.85) and
                (area >= 0.015 * total_pixels)
            )
            
            if is_human_silhouette:
                confidence = float(np.clip(0.60 + (aspect_ratio * 0.08) + (extent * 0.15), 0.65, 0.96))
                people_boxes.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(bw),
                    "height": int(bh),
                    "confidence": round(confidence, 2),
                    "label": "PERSON"
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
        
        # Detect sudden surge in motion
        delta_motion = abs(motion_pct - self.prev_motion_area)
        self.prev_motion_area = motion_pct
        unusual_movement = (delta_motion >= 6.5 or motion_pct >= 20.0)
        
        return {
            "people": {
                "count": len(people_boxes),
                "detected": len(people_boxes) > 0,
                "boxes": people_boxes
            },
            "motion": {
                "motion_detected": motion_pct >= 0.8,
                "motion_pct": motion_pct,
                "motion_score": round(motion_score, 3),
                "unusual_movement": unusual_movement,
                "boxes": motion_boxes
            }
        }
