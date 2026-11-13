import React, { useState } from 'react';
import { Shield, Eye, Activity, Sliders, ShieldAlert, Power, Radio, Volume2, CheckCircle2 } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';

export default function Navbar({
  activeTab,
  setActiveTab,
  riskLevel = 'NORMAL',
  isMonitoring,
  toggleMonitoring,
  roomName,
  alertCount = 0
}) {
  const [audioTested, setAudioTested] = useState(false);

  const handleTestAudio = () => {
    audioSynth.playBeep(880, 0.2);
    setAudioTested(true);
    setTimeout(() => setAudioTested(false), 2000);
  };

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-red-950/90 text-red-300 border border-red-500 shadow-lg shadow-red-500/30 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            CRITICAL THREAT
          </div>
        );
      case 'HIGH RISK':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-950/90 text-orange-300 border border-orange-500 shadow-md shadow-orange-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            HIGH RISK
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            WARNING
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            SYSTEM NORMAL
          </div>
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Live Monitor', icon: Eye },
    { id: 'alerts', label: 'Alert History', icon: ShieldAlert, badge: alertCount },
    { id: 'simulation', label: 'Environmental Sim', icon: Sliders },
    { id: 'testing', label: 'Testing Lab', icon: Activity },
    { id: 'settings', label: 'Contacts & Config', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-navy-950/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Properly Aligned Tagline */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-950 to-navy-900 border border-cyan-400/50 shadow-xl shadow-cyan-500/20">
              <Shield className="w-7 h-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              {isMonitoring && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 shadow-sm" />
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  SENTINEL <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-600/60 shadow-sm">
                  v1.0 Guardian Software
                </span>
              </div>
              <div className="text-xs sm:text-[13px] font-medium tracking-wide text-cyan-200/80 mt-0.5 flex items-center gap-1.5">
                <span>Your Room.</span>
                <span className="text-cyan-400 font-bold">•</span>
                <span>Your Safety.</span>
                <span className="text-cyan-400 font-bold">•</span>
                <span className="text-cyan-300 font-semibold">Your AI Guardian.</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-navy-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Audio Unlock + Status Pill + Kill Switch */}
          <div className="flex items-center gap-3">
            
            {/* Quick Speaker / Audio Test Button */}
            <button
              onClick={handleTestAudio}
              title="Click to test browser sound and unlock audio"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                audioTested
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{audioTested ? 'Sound OK' : 'Test Audio'}</span>
            </button>

            {/* Dynamic Status Badge */}
            {getRiskBadge()}

            {/* Arm / Stop Kill Switch */}
            <button
              onClick={toggleMonitoring}
              title={isMonitoring ? "Click to stop monitoring (Privacy Mode)" : "Click to arm AI Guardian monitoring"}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-lg ${
                isMonitoring
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/60 shadow-red-500/10'
                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/60 shadow-cyan-500/10'
              }`}
            >
              <Power className={`w-4 h-4 ${isMonitoring ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">
                {isMonitoring ? 'DISARM GUARD' : 'ARM GUARD'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-around py-2.5 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 text-[11px] font-mono ${
                  isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
