"""
Unusual Movement & Motion Dynamics Detection
Tracks frame-to-frame displacement, agitation index, and velocity surges.
"""
import cv2
import numpy as np
from typing import Tuple

class MotionDetector:
    def __init__(self, history: int = 60, var_threshold: float = 25):
        # MOG2 background subtractor with shadow suppression
        self.subtractor = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=var_threshold,
            detectShadows=True
        )
        self.motion_history = []
        
    def analyze_motion(self, frame_bgr: np.ndarray) -> Tuple[bool, float, str]:
        """
        Calculates motion intensity and flags sudden erratic / unusual movement.
        Returns: (has_unusual_motion, motion_intensity [0.0 - 1.0], description)
        """
        # Downscale for performance
        small = cv2.resize(frame_bgr, (320, 240))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (7, 7), 0)
        
        fg_mask = self.subtractor.apply(gray)
        # Remove shadows (gray value 127 in MOG2)
        _, fg_thresh = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
        
        # Calculate moving pixel percentage
        total_pixels = small.shape[0] * small.shape[1]
        moving_pixels = cv2.countNonZero(fg_thresh)
        motion_ratio = moving_pixels / float(total_pixels)
        
        # Smooth with sliding window
        self.motion_history.append(motion_ratio)
        if len(self.motion_history) > 15:
            self.motion_history.pop(0)
            
        avg_motion = float(np.mean(self.motion_history))
        current_intensity = round(min(1.0, motion_ratio * 4.0), 3)
        
        # Sudden jerk/surge detection: current ratio is 3.5x higher than ambient rolling baseline
        is_surge = (motion_ratio > 0.12) and (motion_ratio > avg_motion * 2.5)
        has_unusual = is_surge or (motion_ratio > 0.28)
        
        if motion_ratio < 0.015:
            desc = "Static / Idle Room"
        elif motion_ratio < 0.08:
            desc = "Gentle Ambient Movement"
        elif motion_ratio < 0.22:
            desc = "Active Human Movement"
        else:
            desc = "Rapid Agitated Movement / Potential Intrusion or Emergency"
            
        return has_unusual, current_intensity, desc
