"""
Environmental Monitoring Simulation Engine
Generates realistic, physically-consistent environmental physics (temperature, humidity, smoke, gas)
with clear simulated labeling as required by system specifications.
Provides active injection hooks for user testing and safety drills.
"""
import time
import math
import random
from typing import Optional
from app.schemas.alert import EnvironmentalSensorData, SensorHazardInjection

class EnvironmentalSimulator:
    def __init__(self):
        # Baseline normal room conditions
        self.base_temp = 23.5       # Celsius
        self.base_humidity = 48.0   # %
        self.base_smoke = 15.0      # ppm (clean ambient indoor air)
        self.base_gas = 30.0        # ppm (ambient background CO/hydrocarbons)
        
        # Injected overrides for testing drills
        self.override_hazard: Optional[str] = None
        self.override_temp: Optional[float] = None
        self.override_smoke: Optional[float] = None
        self.override_gas: Optional[float] = None
        
        self.start_time = time.time()
        
    def set_injection(self, injection: SensorHazardInjection):
        """Allows security operators or test suite to inject hazards into simulated suite."""
        self.override_hazard = injection.hazard_type
        self.override_temp = injection.temperature_override
        self.override_smoke = injection.smoke_override
        self.override_gas = injection.gas_override

    def reset_to_normal(self):
        self.override_hazard = None
        self.override_temp = None
        self.override_smoke = None
        self.override_gas = None

    def get_current_reading(self) -> EnvironmentalSensorData:
        elapsed = time.time() - self.start_time
        
        # Subtle organic indoor drift
        noise_temp = 0.4 * math.sin(elapsed * 0.05) + random.uniform(-0.1, 0.1)
        noise_hum = 0.8 * math.cos(elapsed * 0.04) + random.uniform(-0.3, 0.3)
        noise_smoke = 2.0 * math.sin(elapsed * 0.1) + random.uniform(-0.8, 0.8)
        noise_gas = 3.0 * math.cos(elapsed * 0.08) + random.uniform(-1.2, 1.2)
        
        current_temp = self.base_temp + noise_temp
        current_humidity = max(20.0, min(80.0, self.base_humidity + noise_hum))
        current_smoke = max(5.0, self.base_smoke + noise_smoke)
        current_gas = max(10.0, self.base_gas + noise_gas)
        
        # Apply manual or scenario overrides
        if self.override_hazard == "FIRE_TEMP":
            current_temp = 68.5 + random.uniform(-1.5, 2.5)
            current_smoke = 280.0 + random.uniform(-10, 25)
        elif self.override_hazard == "SMOKE_SURGE":
            current_smoke = 340.0 + random.uniform(-15, 30)
            current_temp = 38.0 + random.uniform(-0.5, 1.0)
        elif self.override_hazard == "GAS_LEAK":
            current_gas = 620.0 + random.uniform(-30, 45)
        elif self.override_hazard == "COMBINED":
            current_temp = 72.0 + random.uniform(-2, 3)
            current_smoke = 410.0 + random.uniform(-20, 40)
            current_gas = 550.0 + random.uniform(-20, 50)
            
        if self.override_temp is not None:
            current_temp = self.override_temp
        if self.override_smoke is not None:
            current_smoke = self.override_smoke
        if self.override_gas is not None:
            current_gas = self.override_gas
            
        # Determine status
        status = "NORMAL"
        if current_temp >= 55.0 or current_smoke >= 250.0 or current_gas >= 500.0:
            status = "CRITICAL"
        elif current_temp >= 40.0 or current_smoke >= 100.0 or current_gas >= 200.0:
            status = "WARNING"
            
        # Compute Air Quality Index (AQI) based on smoke and gas
        aqi = int(min(500, max(20, (current_smoke * 0.6) + (current_gas * 0.4))))
        
        return EnvironmentalSensorData(
            is_simulated=True,
            label="SIMULATED SENSOR SUITE",
            temperature_celsius=round(current_temp, 1),
            humidity_percent=round(current_humidity, 1),
            smoke_ppm=round(current_smoke, 1),
            gas_ppm=round(current_gas, 1),
            air_quality_index=aqi,
            status=status
        )

simulation_engine = EnvironmentalSimulator()
