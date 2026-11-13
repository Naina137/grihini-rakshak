from typing import Dict, Any
from datetime import datetime

class EnvironmentalSimulator:
    """
    Environmental Sensor Simulator.
    Provides synthetic temperature, humidity, smoke obscuration, and gas level readings
    for software-only deployment without IoT / physical microcontrollers.
    
    IMPORTANT: Every datum explicitly carries `is_simulated = True`.
    """
    PRESETS = {
        "NORMAL": {
            "name": "Normal Indoor Room",
            "temperature": 22.8,
            "humidity": 45.0,
            "smoke_ppm": 1.1,
            "gas_ppm": 3.5,
            "description": "Standard comfortable indoor ambient atmosphere."
        },
        "COOKING_HEAT": {
            "name": "Kitchen Cooking Activity",
            "temperature": 32.5,
            "humidity": 68.0,
            "smoke_ppm": 8.0,
            "gas_ppm": 12.0,
            "description": "Elevated moisture and moderate heat from stovetop/oven."
        },
        "SMOLDERING": {
            "name": "Smoldering Electrical / Fabric Fire",
            "temperature": 48.0,
            "humidity": 30.0,
            "smoke_ppm": 38.5,
            "gas_ppm": 45.0,
            "description": "Dense particulate smoke with rising thermal gradient."
        },
        "CRITICAL_FIRE": {
            "name": "Flashover / Active Fire Hazard",
            "temperature": 84.0,
            "humidity": 18.0,
            "smoke_ppm": 82.0,
            "gas_ppm": 180.0,
            "description": "Extreme convective heat, high toxic combustion gas."
        },
        "GAS_LEAK": {
            "name": "Combustible Gas / Methane Leak",
            "temperature": 21.5,
            "humidity": 44.0,
            "smoke_ppm": 2.0,
            "gas_ppm": 320.0,
            "description": "Explosive combustible hydrocarbon gas accumulation."
        }
    }

    def __init__(self):
        self.current_state = dict(self.PRESETS["NORMAL"])
        self.preset_key = "NORMAL"
        self.manual_override = False

    def get_readings(self) -> Dict[str, Any]:
        return {
            "temperature_c": round(self.current_state["temperature"], 1),
            "temperature_f": round((self.current_state["temperature"] * 9/5) + 32, 1),
            "humidity_pct": round(self.current_state["humidity"], 1),
            "smoke_ppm": round(self.current_state["smoke_ppm"], 1),
            "gas_ppm": round(self.current_state["gas_ppm"], 1),
            "preset_key": self.preset_key,
            "preset_name": self.current_state["name"],
            "description": self.current_state.get("description", ""),
            "is_simulated": True,  # Mandatory safety transparency guarantee
            "disclaimer": "SIMULATION MODE: Synthetic data for software-only demonstration without physical IoT sensors.",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def apply_preset(self, preset_name: str) -> Dict[str, Any]:
        key = preset_name.upper()
        if key in self.PRESETS:
            self.preset_key = key
            self.current_state = dict(self.PRESETS[key])
            self.manual_override = False
        return self.get_readings()

    def set_custom_values(self, temp_c: float, humidity: float, smoke_ppm: float, gas_ppm: float) -> Dict[str, Any]:
        self.preset_key = "CUSTOM"
        self.manual_override = True
        self.current_state = {
            "name": "Custom Manual Simulation",
            "temperature": float(temp_c),
            "humidity": float(humidity),
            "smoke_ppm": float(smoke_ppm),
            "gas_ppm": float(gas_ppm),
            "description": "User-adjusted synthetic parameters."
        }
        return self.get_readings()

environmental_simulator = EnvironmentalSimulator()
