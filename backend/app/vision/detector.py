import cv2
import numpy as np
import base64
import time
from typing import Dict, Any, Optional
from .fire_smoke import FireSmokeDetector
from .human_motion import HumanMotionDetector

class UnifiedVisionDetector:
    """
    Coordinates multi-hazard visual intelligence:
    - Fire detection (flicker, color, shape)
    - Smoke detection (attenuation, desaturation)
    - Human presence count
    - Unusual movement tracking
    """
    def __init__(self):
        self.fire_smoke_engine = FireSmokeDetector()
        self.human_motion_engine = HumanMotionDetector()
        self.frame_count = 0
        self.last_inference_time_ms = 0.0

    def decode_base64_image(self, b64_str: str) -> Optional[np.ndarray]:
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            img_bytes = base64.b64decode(b64_str)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return frame
        except Exception as e:
            print(f"[VisionDetector] Failed to decode image: {e}")
            return None

    def analyze_frame(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        start_t = time.perf_counter()
        self.frame_count += 1
        
        # 1. Fire and Smoke
        fire_res = self.fire_smoke_engine.detect_fire(frame_bgr)
        smoke_res = self.fire_smoke_engine.detect_smoke(frame_bgr)
        
        # 2. People and Motion
        pm_res = self.human_motion_engine.detect_people_and_motion(frame_bgr)
        people_res = pm_res["people"]
        motion_res = pm_res["motion"]
        
        elapsed_ms = (time.perf_counter() - start_t) * 1000.0
        self.last_inference_time_ms = round(elapsed_ms, 2)
        
        # Collate all bounding boxes for frontend canvas overlay
        all_boxes = []
        for b in fire_res.get("boxes", []):
            all_boxes.append({**b, "color": "#ef4444", "category": "fire"})
        for b in smoke_res.get("boxes", []):
            all_boxes.append({**b, "color": "#94a3b8", "category": "smoke"})
        for b in people_res.get("boxes", []):
            all_boxes.append({**b, "color": "#06b6d4", "category": "person"})
        for b in motion_res.get("boxes", []):
            all_boxes.append({**b, "color": "#f59e0b", "category": "motion"})
            
        return {
            "fire": fire_res,
            "smoke": smoke_res,
            "people": people_res,
            "motion": motion_res,
            "boxes": all_boxes,
            "inference_time_ms": self.last_inference_time_ms,
            "frame_index": self.frame_count
        }

unified_vision = UnifiedVisionDetector()
