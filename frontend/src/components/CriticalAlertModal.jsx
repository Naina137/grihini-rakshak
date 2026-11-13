import React, { useEffect, useState } from 'react';
import { AlertTriangle, Volume2, VolumeX, ShieldCheck, PhoneCall, XCircle, Siren, Check } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { acknowledgeAlert } from '../services/api';

export default function CriticalAlertModal({
  alert,
  onAcknowledge,
  emergencyContacts = []
}) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (alert) {
      if (!isMuted) {
        audioSynth.startEmergencySiren();
      }
    } else {
      audioSynth.stopEmergencySiren();
    }
    return () => {
      audioSynth.stopEmergencySiren();
    };
  }, [alert, isMuted]);

  if (!alert) return null;

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      audioSynth.startEmergencySiren();
    } else {
      setIsMuted(true);
      audioSynth.stopEmergencySiren();
    }
  };

  const handleDismiss = (actionType) => {
    // 1. Instantly kill audio siren
    audioSynth.stopEmergencySiren();
    
    // 2. Immediately notify parent to clear modal from DOM without any lag
    if (onAcknowledge) {
      onAcknowledge(alert.id, actionType);
    }
    
    // 3. Fire-and-forget backend acknowledgment
    try {
      const notes = actionType === 'FALSE_ALARM' ? 'Flagged as false alarm by resident' : 'Acknowledged & secured in critical interface';
      acknowledgeAlert(alert.id, notes).catch(() => {});
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/95 backdrop-blur-2xl animate-fade-in">
      
      {/* Background Red Warning Strobe */}
      <div className="absolute inset-0 bg-red-600/15 pointer-events-none animate-pulse-fast" />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950 rounded-3xl p-6 sm:p-8 border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)] text-slate-100 overflow-hidden">
        
        {/* Top Warning Beacon */}
        <div className="flex items-center justify-between pb-4 border-b border-red-500/30">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-red-500 text-white shadow-xl shadow-red-500/50 animate-bounce">
              <Siren className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-mono font-black text-red-400 tracking-widest uppercase">
                CRITICAL SAFETY INCIDENT
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                HAZARD DETECTED IN MONITOR ZONE
              </h2>
            </div>
          </div>

          {/* Siren Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              isMuted
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-red-500/30 text-red-200 border-red-400 animate-pulse shadow-red-500/20'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-red-400" />}
            <span>{isMuted ? 'SIREN MUTED' : 'MUTE SIREN'}</span>
          </button>
        </div>

        {/* Incident Summary Box */}
        <div className="my-5 p-4 sm:p-5 rounded-2xl bg-navy-950/90 border border-red-500/40 space-y-3 font-mono">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">LOCATION:</span>
              <div className="text-sm font-bold text-white mt-0.5">{alert.room_name || 'Primary Living Space'}</div>
            </div>
            <div>
              <span className="text-slate-400">TIMESTAMP:</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <span className="text-slate-400 text-xs">TRIGGERED HAZARD(S):</span>
            <div className="mt-1.5 space-y-1">
              {(alert.hazards || ['Unspecified anomaly']).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contacts Quick Actions */}
        <div className="mb-6">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
            <span>EMERGENCY DISPATCH PROTOCOLS</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {emergencyContacts.slice(0, 2).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800"
              >
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.relationship} • {c.phone}</div>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                  title="Direct Emergency Call"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons: Instantly Stops Siren & Dismisses Modal */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => handleDismiss('ACKNOWLEDGE')}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-slate-950" />
            <span>ACKNOWLEDGE & STOP ALARM</span>
          </button>

          <button
            onClick={() => handleDismiss('FALSE_ALARM')}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
            <span>DISMISS (FALSE ALARM)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
