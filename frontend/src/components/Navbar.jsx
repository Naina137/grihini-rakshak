import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, Radio, Clock, MapPin, Power } from 'lucide-react';
import { APP_NAME, TAGLINE } from '../utils/constants';

export default function Navbar({
  isMonitoring,
  onToggleMonitoring,
  currentRiskLevel,
  activeRoom,
  onChangeRoom,
  wsConnected
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRiskBadge = () => {
    if (!isMonitoring) {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <EyeOff className="w-3.5 h-3.5" />
          STANDBY
        </span>
      );
    }
    switch (currentRiskLevel) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 glow-red animate-pulse-fast">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL THREAT
          </span>
        );
      case 'HIGH RISK':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/50 glow-orange animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            HIGH RISK
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 glow-orange">
            <ShieldAlert className="w-3.5 h-3.5" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-green">
            <ShieldCheck className="w-3.5 h-3.5" />
            SURVEILLANCE NORMAL
          </span>
        );
    }
  };

  return (
    <header className="h-16 border-b border-cyan-500/15 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 glow-cyan">
          <Shield className="w-5 h-5 text-cyan-400" />
          {isMonitoring && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              {APP_NAME}
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              v1.0 AI
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            {TAGLINE}
          </p>
        </div>
      </div>

      {/* Middle: Zone Selector & Risk Badge */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Zone:</span>
          <select 
            value={activeRoom}
            onChange={(e) => onChangeRoom(e.target.value)}
            className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Living Area & Home Office" className="bg-slate-900 text-slate-100">Living Area & Office</option>
            <option value="Server Room Alpha" className="bg-slate-900 text-slate-100">Server Room Alpha</option>
            <option value="Master Bedroom Suite" className="bg-slate-900 text-slate-100">Master Bedroom Suite</option>
            <option value="Laboratory Cleanroom" className="bg-slate-900 text-slate-100">Laboratory Cleanroom</option>
          </select>
        </div>

        {getRiskBadge()}
      </div>

      {/* Right: Telemetry status, clock & Master Killswitch */}
      <div className="flex items-center gap-3">
        {/* WS Link */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-cyan-400 glow-cyan' : 'bg-red-500'}`} />
          {wsConnected ? 'LINK LIVE' : 'CONNECTING'}
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 font-mono px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr}</span>
        </div>

        {/* Master Monitoring Killswitch Button */}
        <button
          onClick={onToggleMonitoring}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg cursor-pointer ${
            isMonitoring
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 glow-red'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold hover:from-cyan-400 hover:to-blue-500 glow-cyan'
          }`}
          title={isMonitoring ? "Stop All Monitoring Tracks (Privacy Protection)" : "Activate Live Room Surveillance"}
        >
          <Power className="w-4 h-4" />
          <span>{isMonitoring ? 'STOP SURVEILLANCE' : 'START SURVEILLANCE'}</span>
        </button>
      </div>
    </header>
  );
}
