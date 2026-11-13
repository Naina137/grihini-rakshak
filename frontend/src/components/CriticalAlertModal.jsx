import React, { useEffect, useState } from 'react';
import { AlertTriangle, Volume2, VolumeX, ShieldCheck, PhoneCall, XCircle, Siren } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { acknowledgeAlert } from '../services/api';

export default function CriticalAlertModal({
  alert,
  onAcknowledge,
  emergencyContacts = []
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAction = async (actionType) => {
    setIsSubmitting(true);
    audioSynth.stopEmergencySiren();
    try {
      const notes = actionType === 'FALSE_ALARM' ? 'Flagged as false alarm by resident' : 'Acknowledged in critical interface';
      await acknowledgeAlert(alert.id, notes);
      if (onAcknowledge) onAcknowledge(alert.id, actionType);
    } catch (e) {
      console.warn('Alert ack error:', e);
      if (onAcknowledge) onAcknowledge(alert.id, actionType);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-xl animate-fade-in">
      
      {/* Background Red Warning Strobe */}
      <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse-fast" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl glass-panel-danger rounded-3xl p-6 sm:p-8 border-2 border-red-500 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Hazard Beacon */}
        <div className="flex items-center justify-between pb-4 border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500 text-white shadow-lg shadow-red-500/50 animate-bounce">
              <Siren className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-red-400 tracking-wider uppercase">
                EMERGENCY PRIORITY HAZARD ALERT
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                CRITICAL THREAT IN PROGRESS
              </h2>
            </div>
          </div>

          {/* Siren Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              isMuted
                ? 'bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-red-500/30 text-red-200 border-red-400 animate-pulse'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-400" />}
            <span>{isMuted ? 'SIREN MUTED' : 'MUTE SIREN'}</span>
          </button>
        </div>

        {/* Incident Summary Card */}
        <div className="my-5 p-4 rounded-2xl bg-navy-950/80 border border-red-500/40 space-y-3 font-mono">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">ROOM / ZONE:</span>
              <div className="text-sm font-bold text-white mt-0.5">{alert.room_name || 'Primary Living Space'}</div>
            </div>
            <div>
              <span className="text-slate-400">TIMESTAMP:</span>
              <div className="text-sm font-bold text-white mt-0.5">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-xs">CONVERGENT HAZARDS IDENTIFIED:</span>
            <div className="mt-1 space-y-1">
              {(alert.hazards || ['Unspecified safety hazard']).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-bold text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Contacts Quick Call */}
        <div className="mb-6">
          <div className="text-xs font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
            <span>AUTOMATIC EMERGENCY DISPATCH TARGETS</span>
            <span className="text-red-400 font-bold">READY</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {emergencyContacts.slice(0, 2).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
              >
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.relationship} • {c.phone}</div>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="p-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                  title="Call Contact"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => handleAction('ACKNOWLEDGE')}
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ACKNOWLEDGE & SECURE</span>
          </button>

          <button
            onClick={() => handleAction('FALSE_ALARM')}
            disabled={isSubmitting}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>MARK FALSE ALARM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
