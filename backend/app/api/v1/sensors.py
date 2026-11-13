"""
Environmental Simulation API Endpoints
Always clearly labelled as simulation per safety protocol.
"""
from fastapi import APIRouter
from app.core.simulation_engine import simulation_engine
from app.schemas.alert import EnvironmentalSensorData, SensorHazardInjection

router = APIRouter(prefix="/sensors", tags=["Environmental Simulation"])

@router.get("/current", response_model=EnvironmentalSensorData)
async def get_current_sensors():
    """Retrieve live simulated environmental sensor telemetry."""
    return simulation_engine.get_current_reading()

@router.post("/inject", response_model=EnvironmentalSensorData)
async def inject_hazard(injection: SensorHazardInjection):
    """
    Inject simulated environmental conditions for drills, testing, and evaluation.
    Allowed hazard_type: FIRE_TEMP, SMOKE_SURGE, GAS_LEAK, COMBINED, or custom overrides.
    """
    simulation_engine.set_injection(injection)
    return simulation_engine.get_current_reading()

@router.post("/reset", response_model=EnvironmentalSensorData)
async def reset_sensors():
    """Reset simulated environment to normal room baseline."""
    simulation_engine.reset_to_normal()
    return simulation_engine.get_current_reading()
