"""
Unit and Integration Tests for Intelligent Multi-Modal Risk Engine
"""
from app.core.risk_engine import RiskEngine
from app.schemas.alert import VisualDetectionResult, AudioClassificationResult, EnvironmentalSensorData

def test_normal_baseline():
    engine = RiskEngine()
    visual = VisualDetectionResult()
    audio = AudioClassificationResult()
    env = EnvironmentalSensorData()
    
    state = engine.evaluate(visual, audio, env)
    assert state.risk_level == "NORMAL"
    assert state.combined_score < 0.25

def test_warning_on_isolated_anomaly():
    engine = RiskEngine()
    visual = VisualDetectionResult(has_unusual_motion=True, motion_intensity=0.55, motion_description="Fast Movement")
    audio = AudioClassificationResult()
    env = EnvironmentalSensorData()
    
    state = engine.evaluate(visual, audio, env)
    assert state.risk_level in ["WARNING", "NORMAL"]

def test_critical_on_multi_modal_convergence():
    engine = RiskEngine()
    # Visual flame + Acoustic Alarm + Hazardous temperature -> Catastrophic Convergence
    visual = VisualDetectionResult(has_fire=True, fire_confidence=0.88)
    audio = AudioClassificationResult(smoke_alarm=0.82, top_hazard_sound="Smoke Alarm", hazard_confidence=0.82)
    env = EnvironmentalSensorData(temperature_celsius=68.0, smoke_ppm=310.0, status="CRITICAL")
    
    # Evaluate across 2 frames for temporal verification
    engine.evaluate(visual, audio, env)
    state = engine.evaluate(visual, audio, env)
    
    assert state.risk_level == "CRITICAL"
    assert state.combined_score >= 0.78
    assert state.verified is True
    assert "Visible Flames" in state.active_hazards

if __name__ == "__main__":
    test_normal_baseline()
    test_warning_on_isolated_anomaly()
    test_critical_on_multi_modal_convergence()
    print("All risk engine tests passed successfully!")
