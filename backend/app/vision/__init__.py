import time
import numpy as np
from app.vision.fire_detector import FireSmokeDetector
from app.vision.person_detector import PersonDetector
from app.vision.motion_detector import MotionDetector
from app.schemas.alert import VisualDetectionResult

class VisionPipeline:
    def __init__(self):
        self.fire_detector = FireSmokeDetector()
        self.person_detector = PersonDetector()
        self.motion_detector = MotionDetector()
        
    def process_frame(self, frame_bgr: np.ndarray) -> VisualDetectionResult:
        start_t = time.time()
        
        # 1. Fire detection
        has_fire, fire_conf, fire_boxes = self.fire_detector.detect_fire(frame_bgr)
        
        # 2. Smoke detection
        has_smoke, smoke_conf, smoke_boxes = self.fire_detector.detect_smoke(frame_bgr)
        
        # 3. Person detection
        people_count, people_boxes = self.person_detector.detect_people(frame_bgr)
        
        # 4. Motion dynamics
        has_unusual_motion, motion_intensity, motion_desc = self.motion_detector.analyze_motion(frame_bgr)
        
        latency = round((time.time() - start_t) * 1000.0, 1)
        
        return VisualDetectionResult(
            has_fire=has_fire,
            fire_confidence=fire_conf,
            fire_regions=fire_boxes,
            has_smoke=has_smoke,
            smoke_confidence=smoke_conf,
            smoke_regions=smoke_boxes,
            people_count=people_count,
            people_regions=people_boxes,
            has_unusual_motion=has_unusual_motion,
            motion_intensity=motion_intensity,
            motion_description=motion_desc,
            analysis_latency_ms=latency
        )

vision_pipeline = VisionPipeline()
