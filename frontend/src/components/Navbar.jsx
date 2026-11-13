import React from 'react';
import { Shield, Eye, AlertTriangle, Activity, Sliders, ShieldAlert, Power, Radio } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  riskLevel = 'NORMAL',
  isMonitoring,
  toggleMonitoring,
  roomName,
  alertCount = 0
}) {
  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/90 text-red-400 border border-red-500 shadow-lg shadow-red-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            CRITICAL RISK
          </span>
        );
      case 'HIGH RISK':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/90 text-orange-400 border border-orange-500 shadow-lg shadow-orange-500/20">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            HIGH RISK
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-500/60">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SYSTEM NORMAL
          </span>
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
    <header className="sticky top-0 z-40 w-full glass-panel-elevated border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/40 shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-cyan-400" />
              {isMonitoring && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  SENTINEL AI
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  v1.0 Software
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Your Room. Your Safety. Your AI Guardian.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-navy-950/60 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Kill Switch */}
          <div className="flex items-center gap-3">
            {getRiskBadge()}

            <button
              onClick={toggleMonitoring}
              title={isMonitoring ? "Click to stop monitoring (Privacy Mode)" : "Click to start AI Guardian monitoring"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                isMonitoring
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50 hover:border-red-400'
                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/50 hover:border-cyan-400'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${isMonitoring ? 'text-red-400' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">
                {isMonitoring ? 'STOP GUARD' : 'ARM GUARD'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 text-[10px] ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'
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
