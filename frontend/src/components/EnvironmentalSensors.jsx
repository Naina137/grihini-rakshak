import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Flame, 
  AlertTriangle, 
  RotateCcw, 
  Zap,
  Info
} from 'lucide-react';
import { API_BASE } from '../utils/constants';

export default function EnvironmentalSensors({ sensorData, onSensorUpdate }) {
  const [injecting, setInjecting] = useState(false);

  const temp = sensorData?.temperature_celsius ?? 23.5;
  const humidity = sensorData?.humidity_percent ?? 48.0;
  const smoke = sensorData?.smoke_ppm ?? 15.0;
  const gas = sensorData?.gas_ppm ?? 32.0;
  const aqi = sensorData?.air_quality_index ?? 42;
  const status = sensorData?.status ?? "NORMAL";

  const handleInject = async (type) => {
    try {
      setInjecting(true);
      const res = await fetch(`${API_BASE}/sensors/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hazard_type: type })
      });
      const data = await res.json();
      if (onSensorUpdate) onSensorUpdate(data);
    } catch (e) {
      console.error("Injection error:", e);
    } finally {
      setInjecting(false);
    }
  };

  const handleReset = async () => {
    try {
      setInjecting(true);
      const res = await fetch(`${API_BASE}/sensors/reset`, { method: 'POST' });
      const data = await res.json();
      if (onSensorUpdate) onSensorUpdate(data);
    } catch (e) {
      console.error("Reset error:", e);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      {/* Header & Prominent Simulation Notice */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Environmental Telemetry
              </h2>
              <p className="text-[11px] text-slate-400">Atmospheric micro-climate telemetry</p>
            </div>
          </div>

          {/* Mandatory Disclaimers */}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 glow-orange flex items-center gap-1">
            <Info className="w-3 h-3" />
            SIMULATED SENSORS
          </span>
        </div>

        {/* Warning Callout: Never Present Simulated as Real */}
        <div className="p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Safety Notice:</strong> No physical IoT hardware required. These environmental values are 
            physically simulated models for software-only risk fusion and emergency response drills.
          </span>
        </div>
      </div>

      {/* 4 Sensor Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-2">
        {/* Temperature */}
        <div className={`p-3 rounded-xl border ${
          temp >= 55 ? 'bg-red-500/20 border-red-500/50 glow-red' :
          temp >= 40 ? 'bg-amber-500/20 border-amber-500/40 glow-orange' :
          'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Temperature</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {temp}°C
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {temp >= 55 ? 'Critical Heat' : temp >= 40 ? 'Elevated Heat' : 'Ambient Safe'}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Humidity</span>
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {humidity}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Relative Moisture
          </div>
        </div>

        {/* Smoke Density */}
        <div className={`p-3 rounded-xl border ${
          smoke >= 250 ? 'bg-red-500/20 border-red-500/50 glow-red' :
          smoke >= 100 ? 'bg-amber-500/20 border-amber-500/40 glow-orange' :
          'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Smoke Sensor</span>
            <Wind className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {smoke} <span className="text-xs font-normal text-slate-400">PPM</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {smoke >= 250 ? 'Hazard Smoke' : smoke >= 100 ? 'Particulate Rise' : 'Clean Air'}
          </div>
        </div>

        {/* Combustible Gas */}
        <div className={`p-3 rounded-xl border ${
          gas >= 500 ? 'bg-red-500/20 border-red-500/50 glow-red' :
          gas >= 200 ? 'bg-amber-500/20 border-amber-500/40 glow-orange' :
          'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-semibold">Combustible Gas</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {gas} <span className="text-xs font-normal text-slate-400">PPM</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {gas >= 500 ? 'Explosion Threat' : gas >= 200 ? 'Vapor Alert' : 'Normal Trace'}
          </div>
        </div>
      </div>

      {/* Interactive Simulation Drill Controls */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Inject Simulated Hazard Scenario:
          </span>
          <button
            onClick={handleReset}
            disabled={injecting}
            className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Baseline
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleInject('FIRE_TEMP')}
            disabled={injecting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-300 transition cursor-pointer"
          >
            🔥 Heat Surge (68°C)
          </button>
          <button
            onClick={() => handleInject('SMOKE_SURGE')}
            disabled={injecting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 transition cursor-pointer"
          >
            💨 Smoke Influx (340 PPM)
          </button>
          <button
            onClick={() => handleInject('GAS_LEAK')}
            disabled={injecting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition cursor-pointer"
          >
            ☣ Gas Leak (620 PPM)
          </button>
          <button
            onClick={() => handleInject('COMBINED')}
            disabled={injecting}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 glow-red transition cursor-pointer"
          >
            🚨 Catastrophe Drill
          </button>
        </div>
      </div>
    </div>
  );
}
