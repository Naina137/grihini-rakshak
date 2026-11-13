import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, Eye, Lock, Save, RefreshCw, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../utils/constants';

export default function SettingsView({ activeRoom, onChangeRoom }) {
  const [settingsData, setSettingsData] = useState({
    room_id: "ROOM-ALPHA-01",
    room_name: activeRoom,
    fire_threshold: 0.65,
    smoke_threshold: 0.55,
    glass_threshold: 0.70,
    alarm_threshold: 0.68,
    scream_threshold: 0.65,
    motion_threshold: 0.40,
    local_processing_only: true,
    allow_raw_audio_storage: false,
    allow_raw_frame_storage: false
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        setSettingsData(data);
      } catch (e) {
        console.error("Fetch settings failed:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      if (onChangeRoom) onChangeRoom(settingsData.room_name);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Safety Engine Thresholds & Privacy Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Fine-tune neural network sensitivity, temporal verification windows, and privacy isolation parameters.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Safety parameters updated successfully and propagated to risk engine.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Zone Identification Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Monitored Zone Identification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Zone Identifier *</label>
              <input
                type="text"
                value={settingsData.room_id}
                onChange={e => setSettingsData({ ...settingsData, room_id: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Room Display Name *</label>
              <input
                type="text"
                value={settingsData.room_name}
                onChange={e => setSettingsData({ ...settingsData, room_name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* AI Computer Vision Thresholds */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Visual Detection Sensitivity Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Flame Confidence</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.fire_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={settingsData.fire_threshold}
                onChange={e => setSettingsData({ ...settingsData, fire_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Smoke Influx</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.smoke_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={settingsData.smoke_threshold}
                onChange={e => setSettingsData({ ...settingsData, smoke_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Motion Sensitivity</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.motion_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={settingsData.motion_threshold}
                onChange={e => setSettingsData({ ...settingsData, motion_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Acoustic AI Classifiers Thresholds */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Acoustic Safety Sensitivity Thresholds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Glass Breaking</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.glass_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                value={settingsData.glass_threshold}
                onChange={e => setSettingsData({ ...settingsData, glass_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Smoke / Fire Siren</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.alarm_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                value={settingsData.alarm_threshold}
                onChange={e => setSettingsData({ ...settingsData, alarm_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Human Distress Scream</span>
                <span className="font-mono text-cyan-400">{Math.round(settingsData.scream_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                value={settingsData.scream_threshold}
                onChange={e => setSettingsData({ ...settingsData, scream_threshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Privacy & Ephemeral Memory Guarantees */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Zero-Leak Privacy Architecture</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-semibold text-slate-100">Local Client-Side & Local Backend Processing</div>
                <div className="text-[11px] text-slate-400">Strict local AI inference. No cloud telemetry transmission.</div>
              </div>
              <input
                type="checkbox"
                checked={settingsData.local_processing_only}
                onChange={e => setSettingsData({ ...settingsData, local_processing_only: e.target.checked })}
                className="rounded text-cyan-400 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 opacity-80">
              <div>
                <div className="font-semibold text-slate-100">Ephemerality: Prohibit Persistent Audio/Video Storage</div>
                <div className="text-[11px] text-slate-400">Audio and video frames exist solely in RAM buffers and are instantly garbage collected.</div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                LOCKED STRICT
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 glow-cyan shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Safety Engine...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
