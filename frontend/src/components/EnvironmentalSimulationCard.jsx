import React, { useState, useEffect } from 'react';
import { Sliders, Thermometer, Droplets, CloudFog, AlertOctagon, Info, Sparkles, Check } from 'lucide-react';
import { fetchSimulationStatus, applySimulationPreset, updateCustomSimulation } from '../services/api';

export default function EnvironmentalSimulationCard({ simData, onSimUpdate }) {
  const [readings, setReadings] = useState(simData || {
    temperature_c: 23.5,
    temperature_f: 74.3,
    humidity_pct: 48.0,
    smoke_ppm: 1.2,
    gas_ppm: 4.0,
    preset_name: 'Normal Indoor Room',
    preset_key: 'NORMAL',
    is_simulated: true
  });

  const [activePreset, setActivePreset] = useState('NORMAL');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValues, setCustomValues] = useState({
    temp: 23.5,
    humidity: 48.0,
    smoke: 1.2,
    gas: 4.0
  });

  useEffect(() => {
    if (simData) {
      setReadings(simData);
      if (simData.preset_key) {
        setActivePreset(simData.preset_key);
      }
    }
  }, [simData]);

  const handleSelectPreset = async (key) => {
    try {
      setActivePreset(key);
      setIsCustomMode(false);
      const res = await applySimulationPreset(key);
      if (res && res.readings) {
        setReadings(res.readings);
        if (onSimUpdate) onSimUpdate(res.readings);
      }
    } catch (e) {
      console.warn('Preset error:', e);
    }
  };

  const handleSliderChange = async (key, val) => {
    const updated = { ...customValues, [key]: parseFloat(val) };
    setCustomValues(updated);
    setIsCustomMode(true);
    setActivePreset('CUSTOM');

    try {
      const res = await updateCustomSimulation(
        updated.temp,
        updated.humidity,
        updated.smoke,
        updated.gas
      );
      if (res && res.readings) {
        setReadings(res.readings);
        if (onSimUpdate) onSimUpdate(res.readings);
      }
    } catch (e) {
      console.warn('Custom sim error:', e);
    }
  };

  // Status helper colors
  const getTempColor = (c) => c > 60 ? 'text-red-400' : c > 35 ? 'text-amber-400' : 'text-emerald-400';
  const getGasColor = (ppm) => ppm > 100 ? 'text-red-400 animate-pulse' : ppm > 30 ? 'text-amber-400' : 'text-emerald-400';
  const getSmokeColor = (ppm) => ppm > 40 ? 'text-red-400 animate-pulse' : ppm > 15 ? 'text-amber-400' : 'text-emerald-400';

  const presetsList = [
    { key: 'NORMAL', label: 'Normal Room' },
    { key: 'COOKING_HEAT', label: 'Kitchen Heat' },
    { key: 'SMOLDERING', label: 'Smoldering Fire' },
    { key: 'CRITICAL_FIRE', label: 'Flashover / Fire' },
    { key: 'GAS_LEAK', label: 'Gas Leak' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
      
      {/* Header & Mandatory Simulation Transparency Notice */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                ENVIRONMENTAL SIMULATION
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Software-Only Demonstration (No Physical IoT Microcontroller Required)
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            SIMULATION MODE
          </span>
        </div>

        {/* Mandatory Transparency Banner */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 font-mono mb-4">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-amber-300 font-bold">TRANSPARENCY GUARANTEE:</strong> Physical temperature, smoke, and gas sensors are not attached. All readings below are generated in simulation mode to test the Intelligent Risk Engine.
          </p>
        </div>

        {/* 4 Environmental Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 font-mono">
          
          {/* Temperature */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> TEMP
              </span>
              <span className="text-[10px] text-slate-500">SIMULATED</span>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-extrabold ${getTempColor(readings.temperature_c)}`}>
                {readings.temperature_c}°C
              </div>
              <div className="text-[10px] text-slate-400">
                {readings.temperature_f}°F
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> HUMIDITY
              </span>
              <span className="text-[10px] text-slate-500">SIMULATED</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-extrabold text-blue-400">
                {readings.humidity_pct}%
              </div>
              <div className="text-[10px] text-slate-400">
                Relative (RH)
              </div>
            </div>
          </div>

          {/* Smoke PPM */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <CloudFog className="w-3.5 h-3.5 text-slate-300" /> SMOKE
              </span>
              <span className="text-[10px] text-slate-500">SIMULATED</span>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-extrabold ${getSmokeColor(readings.smoke_ppm)}`}>
                {readings.smoke_ppm} <span className="text-xs font-normal">PPM</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Particulate Obscuration
              </div>
            </div>
          </div>

          {/* Gas PPM */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5 text-orange-400" /> GAS / CO
              </span>
              <span className="text-[10px] text-slate-500">SIMULATED</span>
            </div>
            <div className="mt-2">
              <div className={`text-2xl font-extrabold ${getGasColor(readings.gas_ppm)}`}>
                {readings.gas_ppm} <span className="text-xs font-normal">PPM</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Combustible / Toxic
              </div>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center justify-between">
            <span>SCENARIO PRESETS</span>
            <span className="text-cyan-400 font-semibold">{readings.preset_name}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-mono">
            {presetsList.map(p => (
              <button
                key={p.key}
                onClick={() => handleSelectPreset(p.key)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center ${
                  activePreset === p.key
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Manual Sliders */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3 font-mono">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>MANUAL SENSOR OVERRIDE</span>
            <span className="text-[10px] text-slate-500">Drag to adjust synthetic readings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Temp Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Temperature</span>
                <span>{readings.temperature_c}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="0.5"
                value={readings.temperature_c}
                onChange={(e) => handleSliderChange('temp', e.target.value)}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Gas Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Gas / CO (PPM)</span>
                <span>{readings.gas_ppm} PPM</span>
              </div>
              <input
                type="range"
                min="0"
                max="350"
                step="1"
                value={readings.gas_ppm}
                onChange={(e) => handleSliderChange('gas', e.target.value)}
                className="w-full accent-orange-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
