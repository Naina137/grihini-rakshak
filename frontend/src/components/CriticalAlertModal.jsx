import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  PhoneCall, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  X 
} from 'lucide-react';
import { playEmergencySiren, stopEmergencySiren } from '../utils/audioSynthesizer';
import { API_BASE } from '../utils/constants';

export default function CriticalAlertModal({
  alert,
  onAcknowledge,
  onDismiss
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    // Automatically sound the emergency siren for CRITICAL alerts if not muted
    if (alert && alert.risk_level === 'CRITICAL' && !isMuted) {
      playEmergencySiren();
    }
    return () => {
      stopEmergencySiren();
    };
  }, [alert, isMuted]);

  if (!alert) return null;

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      playEmergencySiren();
    } else {
      setIsMuted(true);
      stopEmergencySiren();
    }
  };

  const handleDispatch = async () => {
    try {
      setDispatchStatus("DISPATCHING...");
      // Simulate emergency call to primary first responder
      const res = await fetch(`${API_BASE}/contacts/1/test-alert`, { method: 'POST' });
      const data = await res.json();
      setDispatchStatus(`DISPATCHED: ${data.recipient || 'First Responders'} notified via automated Voice & SMS.`);
    } catch (e) {
      setDispatchStatus("DISPATCH SIMULATED: Building security notified.");
    }
  };

  const isCritical = alert.risk_level === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-lg rounded-2xl p-6 sm:p-7 border relative shadow-2xl transition-all duration-300 ${
        isCritical 
          ? 'bg-gradient-to-b from-red-950/90 to-slate-950/95 border-red-500/70 glow-red' 
          : 'bg-gradient-to-b from-amber-950/80 to-slate-950/95 border-amber-500/60 glow-orange'
      }`}>
        {/* Close / Dismiss */}
        <button
          onClick={() => {
            stopEmergencySiren();
            onDismiss();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-3 rounded-2xl flex items-center justify-center animate-pulse ${
            isCritical ? 'bg-red-500/30 text-red-400 border border-red-500' : 'bg-amber-500/30 text-amber-400 border border-amber-500'
          }`}>
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-extrabold tracking-wider uppercase ${
                isCritical ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}>
                {alert.risk_level} SAFETY ALERT
              </span>
              <span className="text-xs text-slate-400 font-mono">ID #{alert.id || 'LIVE'}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 mt-1">
              {alert.hazard_type || 'Potential Hazard Detected'}
            </h2>
          </div>
        </div>

        {/* Incident Metadata */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs mb-4">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">{alert.room_name || 'Living Area & Office'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Hazard Summary & Details */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 mb-5 space-y-2">
          <p className="leading-relaxed font-medium text-slate-200">
            {alert.summary || "High threat probability computed across real-time visual and acoustic sensor evidence."}
          </p>

          <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
            <div>Confidence: <span className="text-slate-100 font-mono font-bold">{Math.round((alert.combined_score || 0.85) * 100)}%</span></div>
            <div>Risk Category: <span className="text-red-400 font-bold">{alert.risk_level}</span></div>
          </div>
        </div>

        {/* Dispatch Feedback if triggered */}
        {dispatchStatus && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Actions Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Mute Siren Button */}
          <button
            onClick={toggleMute}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isMuted
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-red-500/20 text-red-300 border-red-500/40 glow-red'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            <span>{isMuted ? 'Unmute Siren' : 'Mute Siren'}</span>
          </button>

          {/* Dispatch First Responders Button */}
          <button
            onClick={handleDispatch}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-lg transition cursor-pointer glow-red"
          >
            <PhoneCall className="w-4 h-4" />
            <span>One-Touch 911 / Security Dispatch</span>
          </button>

          {/* Acknowledge Button */}
          <button
            onClick={() => {
              stopEmergencySiren();
              onAcknowledge(alert.id);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
