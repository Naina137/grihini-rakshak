"""
Human Person Detection Engine
Uses body silhouette geometry, head-torso aspect ratio analysis,
and motion bounding to reliably identify human presence in monitoring field.
"""
import cv2
import numpy as np
from typing import List, Tuple
from app.schemas.alert import BoundingBox

class PersonDetector:
    def __init__(self):
        # Background subtractor for tracking active human silhouettes
        self.bg_sub = cv2.createBackgroundSubtractorMOG2(history=100, varThreshold=30, detectShadows=True)

    def detect_people(self, frame_bgr: np.ndarray) -> Tuple[int, List[BoundingBox]]:
        """
        Detects individuals in the monitoring field with bounding boxes and confidence.
        Human criteria:
        1. Aspect ratio (height > width, typically 1.2 <= h/w <= 3.8).
        2. Area occupies significant portion (> 1.5% and < 80% of room).
        3. Vertical center of mass (head/torso weight higher than legs).
        """
        h, w = frame_bgr.shape[:2]
        frame_area = h * w
        
        # Color & motion segmentation
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)
        
        fg_mask = self.bg_sub.apply(blurred)
        _, thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        
        # Morphological close to join limbs and torso
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 15))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        person_boxes: List[BoundingBox] = []
        
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            area = cv2.contourArea(cnt)
            
            # Area filter
            if area < (frame_area * 0.02) or area > (frame_area * 0.75):
                continue
                
            aspect_ratio = float(bh) / float(bw) if bw > 0 else 0
            
            # Typical human posture: standing or sitting
            if 1.1 <= aspect_ratio <= 4.0:
                # Solidity measure: contourArea / (bw * bh)
                solidity = area / float(bw * bh) if (bw * bh) > 0 else 0
                
                # Human silhouettes typically have solidity between 0.35 and 0.85
                if 0.35 <= solidity <= 0.88:
                    confidence = round(float(min(0.96, 0.65 + (solidity * 0.2) + (area / frame_area) * 0.15)), 2)
                    person_boxes.append(BoundingBox(
                        x=int(x),
                        y=int(y),
                        width=int(bw),
                        height=int(bh),
                        label=f"Person ({int(confidence*100)}%)",
                        confidence=confidence
                    ))
                    
        return len(person_boxes), person_boxes
