import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { RISK_LEVELS } from '../utils/constants';

export default function RiskGauge({ riskState }) {
  const riskLevel = riskState?.risk_level || 'NORMAL';
  const score = riskState?.combined_score || 0.0;
  const verified = riskState?.verified || false;
  const activeHazards = riskState?.active_hazards || [];
  const recommendation = riskState?.recommendation || "Environment secure. Continuous surveillance active.";

  const config = RISK_LEVELS[riskLevel.replace(' ', '_')] || RISK_LEVELS.NORMAL;

  // Percentage for arc (0 to 100)
  const percent = Math.round(score * 100);

  // Determine stroke color
  let strokeColor = '#10B981';
  if (riskLevel === 'CRITICAL') strokeColor = '#EF4444';
  else if (riskLevel === 'HIGH RISK') strokeColor = '#F97316';
  else if (riskLevel === 'WARNING') strokeColor = '#F59E0B';

  // SVG semi-circle gauge calculation
  const radius = 70;
  const circumference = Math.PI * radius; // 180 degrees
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${
      riskLevel === 'CRITICAL'
        ? 'glass-panel-danger glow-red animate-pulse-fast'
        : riskLevel === 'HIGH RISK'
        ? 'glass-panel glow-orange'
        : riskLevel === 'WARNING'
        ? 'glass-panel glow-orange'
        : 'glass-panel glow-cyan'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {riskLevel === 'CRITICAL' ? (
              <AlertOctagon className="w-4 h-4 text-red-400 animate-spin" />
            ) : riskLevel === 'NORMAL' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Intelligent Risk Engine</h2>
            <p className="text-[11px] text-slate-400">Multi-modal visual & acoustic convergence</p>
          </div>
        </div>

        {/* Temporal Verification Pill */}
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
          verified 
            ? 'bg-cyan-950 text-cyan-300 border-cyan-700' 
            : 'bg-slate-900 text-slate-400 border-slate-800'
        }`}>
          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
          <span>{verified ? 'TEMPORAL VERIFIED' : 'SCANNING DYNAMICS'}</span>
        </div>
      </div>

      {/* Speedometer Radial Gauge */}
      <div className="flex flex-col items-center justify-center my-2 relative">
        <svg width="190" height="110" viewBox="0 0 190 110" className="overflow-visible">
          {/* Background track arc */}
          <path
            d="M 20 100 A 75 75 0 0 1 170 100"
            fill="none"
            stroke="#1E293B"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d="M 20 100 A 75 75 0 0 1 170 100"
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Text inside Arc */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
            {percent}%
          </div>
          <div className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.text}`}>
            {riskLevel}
          </div>
        </div>
      </div>

      {/* Active Hazards Breakdown */}
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Active Threat Triggers:</span>
          <span className="font-mono text-slate-200">{activeHazards.length} detected</span>
        </div>

        {activeHazards.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {activeHazards.map((hazard, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/40"
              >
                ⚠ {hazard}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 py-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero active hazards across all sensory channels.</span>
          </div>
        )}

        {/* Actionable Recommendation */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
          <span className="text-cyan-400 font-bold mr-1">ACTION:</span>
          {recommendation}
        </div>
      </div>
    </div>
  );
}
