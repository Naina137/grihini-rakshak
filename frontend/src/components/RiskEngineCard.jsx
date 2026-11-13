import React from 'react';
import { Shield, AlertTriangle, Flame, Bell, Wind, User, Activity, CheckCircle2, ChevronRight } from 'lucide-react';

export default function RiskEngineCard({ riskData, visionData, audioData, simData }) {
  const risk = riskData || {
    risk_level: 'NORMAL',
    risk_score: 12.0,
    hazards: [],
    recommended_action: 'ENVIRONMENT SECURE - CONTINUOUS GUARDIAN MONITORING ACTIVE',
    evidence: {}
  };

  const getTheme = () => {
    switch (risk.risk_level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-950/40 border-red-500/60 text-red-400',
          badge: 'bg-red-500 text-white',
          glow: 'glow-red',
          progress: 'bg-red-500',
          title: 'CRITICAL HAZARD - EVACUATION ALERT',
          borderColor: 'border-red-500/50'
        };
      case 'HIGH RISK':
        return {
          bg: 'bg-orange-950/40 border-orange-500/60 text-orange-400',
          badge: 'bg-orange-500 text-slate-950',
          glow: 'glow-amber',
          progress: 'bg-orange-500',
          title: 'HIGH RISK LEVEL - INVESTIGATE NOW',
          borderColor: 'border-orange-500/50'
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-950/40 border-amber-500/50 text-amber-300',
          badge: 'bg-amber-500 text-slate-950',
          glow: 'glow-amber',
          progress: 'bg-amber-400',
          title: 'WARNING LEVEL - ANOMALY DETECTED',
          borderColor: 'border-amber-500/40'
        };
      default:
        return {
          bg: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          glow: 'glow-emerald',
          progress: 'bg-emerald-400',
          title: 'NORMAL STATUS - GUARDIAN VIGILANT',
          borderColor: 'border-emerald-500/30'
        };
    }
  };

  const theme = getTheme();
  const score = Math.round(risk.risk_score || 0);

  return (
    <div className={`glass-panel rounded-2xl p-4 sm:p-5 border ${theme.borderColor} shadow-xl relative overflow-hidden flex flex-col justify-between`}>
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${theme.bg}`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                MULTI-MODAL RISK ENGINE
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Visual + Acoustic + Atmospheric Convergence Matrix
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border shadow-sm ${theme.badge}`}>
            {risk.risk_level}
          </span>
        </div>

        {/* Risk Score Dial & Level Banner */}
        <div className={`p-4 rounded-xl border ${theme.bg} mb-4 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                CONVERGENT THREAT INDEX
              </div>
              <div className="text-3xl font-extrabold tracking-tight font-mono text-slate-100 flex items-baseline gap-1 mt-0.5">
                <span>{score}</span>
                <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Circular / Radial Progress Pill */}
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">
                {theme.title}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                TEMPORAL CONFIRMATION: {score >= 60 ? 'ACTIVE' : 'IDLE'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 mt-3 overflow-hidden">
            <div
              className={`h-full ${theme.progress} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            />
          </div>
        </div>

        {/* Active Hazards Alert Feed */}
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>TRIGGERED SAFETY HAZARDS</span>
            <span className="text-slate-500">{risk.hazards.length} ACTIVE</span>
          </div>

          {risk.hazards.length === 0 ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-400 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No critical visual, audio, or atmospheric hazards detected.</span>
            </div>
          ) : (
            risk.hazards.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-200 font-mono animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{h}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recommended Action Protocol */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
          RECOMMENDED PROTOCOL
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-200 font-mono flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{risk.recommended_action}</span>
        </div>
      </div>
    </div>
  );
}
