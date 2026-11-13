from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from ..engine.simulation import environmental_simulator

router = APIRouter()

class PresetRequest(BaseModel):
    preset_name: str

class CustomSimRequest(BaseModel):
    temperature: float
    humidity: float
    smoke_ppm: float
    gas_ppm: float

@router.get("/")
def get_simulation_status():
    return {
        "readings": environmental_simulator.get_readings(),
        "available_presets": environmental_simulator.PRESETS
    }

@router.post("/preset")
def set_preset(req: PresetRequest):
    updated = environmental_simulator.apply_preset(req.preset_name)
    return {"status": "SUCCESS", "readings": updated}

@router.post("/custom")
def set_custom(req: CustomSimRequest):
    updated = environmental_simulator.set_custom_values(
        temp_c=req.temperature,
        humidity=req.humidity,
        smoke_ppm=req.smoke_ppm,
        gas_ppm=req.gas_ppm
    )
    return {"status": "SUCCESS", "readings": updated}
