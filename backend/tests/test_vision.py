"""
Unit and Integration Tests for Computer Vision Pipeline
"""
import numpy as np
import cv2
from app.vision.fire_detector import FireSmokeDetector
from app.vision.motion_detector import MotionDetector
from app.vision import vision_pipeline
from app.api.v1.testing import _generate_synthetic_fire_frame, _generate_synthetic_smoke_frame

def test_fire_detector_positive():
    detector = FireSmokeDetector()
    frame = _generate_synthetic_fire_frame()
    has_fire, conf, boxes = detector.detect_fire(frame)
    assert has_fire is True or conf >= 0.40
    assert len(boxes) > 0 or conf > 0.30

def test_fire_detector_suppresses_static_lamp():
    detector = FireSmokeDetector()
    frame = np.full((360, 480, 3), 20, dtype=np.uint8)
    cv2.circle(frame, (240, 200), 40, (0, 180, 255), -1)
    has_fire, conf, boxes = detector.detect_fire(frame)
    assert conf < 0.65

def test_smoke_detector():
    detector = FireSmokeDetector()
    frame = _generate_synthetic_smoke_frame()
    has_smoke, conf, boxes = detector.detect_smoke(frame)
    assert conf > 0.35 or has_smoke is True

def test_motion_detector():
    detector = MotionDetector()
    f1 = np.zeros((240, 320, 3), dtype=np.uint8)
    detector.analyze_motion(f1)
    f2 = np.full((240, 320, 3), 255, dtype=np.uint8)
    has_motion, intensity, desc = detector.analyze_motion(f2)
    assert intensity > 0.0

def test_vision_pipeline_latency():
    frame = np.zeros((360, 480, 3), dtype=np.uint8)
    res = vision_pipeline.process_frame(frame)
    assert res.analysis_latency_ms >= 0.0
    assert res.has_fire is False

if __name__ == "__main__":
    test_fire_detector_positive()
    test_fire_detector_suppresses_static_lamp()
    test_smoke_detector()
    test_motion_detector()
    test_vision_pipeline_latency()
    print("All vision pipeline tests passed successfully!")
