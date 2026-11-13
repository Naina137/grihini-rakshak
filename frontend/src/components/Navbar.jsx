import React, { useState } from 'react';
import { Shield, Eye, Activity, Sliders, ShieldAlert, Power, Radio, Volume2, Globe, Box, HeartPulse, HelpCircle } from 'lucide-react';
import { audioSynth } from '../utils/audioSynth';
import { translations } from '../utils/translations';

export default function Navbar({
  activeTab,
  setActiveTab,
  riskLevel = 'NORMAL',
  isMonitoring,
  toggleMonitoring,
  roomName,
  alertCount = 0,
  lang = 'en',
  setLang,
  onOpenGuide
}) {
  const [audioTested, setAudioTested] = useState(false);
  const t = translations[lang] || translations.en;

  const handleTestAudio = () => {
    audioSynth.playBeep(880, 0.2);
    setAudioTested(true);
    setTimeout(() => setAudioTested(false), 2000);
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    audioSynth.playBeep(640, 0.12);
  };

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-red-950/90 text-red-300 border border-red-500 shadow-lg shadow-red-500/30 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            {t.criticalThreat}
          </div>
        );
      case 'HIGH RISK':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-950/90 text-orange-300 border border-orange-500 shadow-md shadow-orange-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            {t.highRisk}
          </div>
        );
      case 'WARNING':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-md shadow-amber-500/10">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            {t.warning}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            {t.systemNormal}
          </div>
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: t.liveMonitor, icon: Eye },
    { id: 'scanner', label: t.roomScanner, icon: Box },
    { id: 'voice', label: t.voiceWellness, icon: HeartPulse },
    { id: 'alerts', label: t.alertHistory, icon: ShieldAlert, badge: alertCount },
    { id: 'simulation', label: t.environmentalSim, icon: Sliders },
    { id: 'testing', label: t.testingLab, icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Centered Aligned Tagline */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-cyan-950 to-black border border-amber-400/50 shadow-xl shadow-amber-500/15">
              <Shield className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              {isMonitoring && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 shadow-sm" />
                </span>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                  GRIHINI <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">RAKSHAK</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-sm">
                  {lang === 'hi' ? 'घरेलू AI रक्षक' : 'AI Home Guardian'}
                </span>
              </div>
              <div className="text-xs sm:text-[13px] font-medium tracking-wide text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span>{t.tagline}</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-navy-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all transform hover:-translate-y-0.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/15'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
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

          {/* Right Action Controls: Welcome Guide + Language Toggle + Audio Test + Status Pill + Kill Switch */}
          <div className="flex items-center gap-2">
            
            {/* Guide Button */}
            <button
              onClick={onOpenGuide}
              title={lang === 'hi' ? 'आपदा सुरक्षा गाइड देखें' : 'View Disaster Protection Guide'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-950/60 text-xs font-mono font-bold transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'hi' ? 'गाइड' : 'Guide'}</span>
            </button>

            {/* Language Switcher (Hindi / English) */}
            <button
              onClick={toggleLanguage}
              title={t.switchLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-navy-900/90 text-cyan-300 hover:bg-cyan-950/60 text-xs font-mono font-bold transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.currentLangLabel}</span>
            </button>

            {/* Quick Speaker / Audio Test Button */}
            <button
              onClick={handleTestAudio}
              title="Click to test browser sound and unlock audio"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all transform hover:-translate-y-0.5 cursor-pointer ${
                audioTested
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{audioTested ? t.soundOk : t.testAudio}</span>
            </button>

            {/* Dynamic Status Badge */}
            {getRiskBadge()}

            {/* Arm / Stop Kill Switch */}
            <button
              onClick={toggleMonitoring}
              title={isMonitoring ? "Click to stop monitoring" : "Click to arm AI Guardian monitoring"}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                isMonitoring
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/60 shadow-red-500/10'
                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/60 shadow-cyan-500/10'
              }`}
            >
              <Power className={`w-4 h-4 ${isMonitoring ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
              <span className="hidden sm:inline">
                {isMonitoring ? t.disarmGuard : t.armGuard}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex xl:hidden items-center justify-around py-2.5 border-t border-slate-800/80">
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
