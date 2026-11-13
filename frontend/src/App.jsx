import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import LiveCameraCard from './components/LiveCameraCard';
import AudioMonitorCard from './components/AudioMonitorCard';
import RiskEngineCard from './components/RiskEngineCard';
import EnvironmentalSimulationCard from './components/EnvironmentalSimulationCard';
import CriticalAlertModal from './components/CriticalAlertModal';
import AlertHistoryTab from './components/AlertHistoryTab';
import TestingLabTab from './components/TestingLabTab';
import SettingsTab from './components/SettingsTab';
import HolographicRoom3D from './components/HolographicRoom3D';
import RoomHazardAnalysisCard from './components/RoomHazardAnalysisCard';
import VoiceWellnessCard from './components/VoiceWellnessCard';
import WelcomeGuideModal from './components/WelcomeGuideModal';
import { fetchAlerts, fetchContacts, fetchSimulationStatus, dismissCriticalModal, applySimulationPreset } from './services/api';
import { audioSynth } from './utils/audioSynth';
import { translations } from './utils/translations';

export default function App() {
  const [lang, setLang] = useState('hi'); // Default to Hindi as requested, toggleable to English
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [roomName, setRoomName] = useState('Living Room - Unit 4B');
  const [selectedHazardNode, setSelectedHazardNode] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const t = translations[lang] || translations.en;

  // Real-time telemetry state
  const [riskData, setRiskData] = useState({
    risk_level: 'NORMAL',
    risk_score: 8.0,
    hazards: [],
    recommended_action: 'ENVIRONMENT SECURE - CONTINUOUS GUARDIAN MONITORING ACTIVE',
    evidence: {}
  });
  const [visionData, setVisionData] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [simData, setSimData] = useState(null);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState(null);
  const [recentAlertsCount, setRecentAlertsCount] = useState(0);
  const [contacts, setContacts] = useState([]);

  const alertSnoozeUntilRef = useRef(0);

  useEffect(() => {
    async function init() {
      try {
        const [cRes, aRes, sRes] = await Promise.all([
          fetchContacts().catch(() => ({ contacts: [] })),
          fetchAlerts(10).catch(() => ({ alerts: [], active_critical: null })),
          fetchSimulationStatus().catch(() => ({ readings: null }))
        ]);

        if (cRes?.contacts) setContacts(cRes.contacts);
        if (aRes?.alerts) setRecentAlertsCount(aRes.alerts.filter(a => !a.acknowledged).length);
        if (sRes?.readings) setSimData(sRes.readings);

        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (err) {}
    }
    init();
  }, []);

  const handleVisionUpdate = useCallback((data) => {
    if (!data) return;
    if (data.vision) setVisionData(data.vision);
    if (data.risk) {
      setRiskData(data.risk);
      if (data.risk.risk_level === 'CRITICAL' && data.new_alert) {
        triggerCriticalAlert(data.new_alert);
      }
    }
    if (data.simulation) setSimData(data.simulation);
  }, []);

  const handleAudioUpdate = useCallback((data) => {
    if (!data) return;
    if (data.audio) setAudioData(data.audio);
    if (data.risk) {
      setRiskData(data.risk);
      if (data.risk.risk_level === 'CRITICAL' && data.new_alert) {
        triggerCriticalAlert(data.new_alert);
      }
    }
    if (data.simulation) setSimData(data.simulation);
  }, []);

  const handleSimUpdate = useCallback((updatedSim) => {
    setSimData(updatedSim);
  }, []);

  const triggerCriticalAlert = (alertObj) => {
    if (Date.now() < alertSnoozeUntilRef.current) {
      return;
    }

    setActiveCriticalAlert(alertObj);
    setRecentAlertsCount(prev => prev + 1);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('GRIHINI RAKSHAK - CRITICAL HAZARD ALERT', {
          body: `Emergency in ${alertObj.room_name}: ${(alertObj.hazards || []).join(', ')}`,
          icon: '/vite.svg',
          tag: alertObj.id
        });
      } catch (e) {}
    }
  };

  const handleAcknowledgeAlert = async (alertId, actionType) => {
    audioSynth.stopEmergencySiren();
    alertSnoozeUntilRef.current = Date.now() + 30000;
    setActiveCriticalAlert(null);

    try {
      const resetSim = await applySimulationPreset('NORMAL');
      if (resetSim?.readings) setSimData(resetSim.readings);
    } catch (e) {}

    setRiskData({
      risk_level: 'NORMAL',
      risk_score: 10.0,
      hazards: [],
      recommended_action: 'ENVIRONMENT SECURE - CONTINUOUS GUARDIAN MONITORING ACTIVE',
      evidence: {}
    });

    setRecentAlertsCount(prev => Math.max(0, prev - 1));
    dismissCriticalModal().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black font-sans antialiased">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        riskLevel={riskData.risk_level}
        isMonitoring={isMonitoring}
        toggleMonitoring={() => setIsMonitoring(!isMonitoring)}
        roomName={roomName}
        alertCount={recentAlertsCount}
        lang={lang}
        setLang={setLang}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Welcome Intro Banner for Grihini Rakshak */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/30 via-navy-900/60 to-cyan-950/30 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>🛡️ {t.welcomeBadge}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">
              {t.welcomeTitle}
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-300 max-w-3xl leading-relaxed">
              {t.welcomeMessage}
            </p>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
          >
            {lang === 'hi' ? 'आपदा गाइड पढ़ें 📖' : 'Read Disaster Guide 📖'}
          </button>
        </div>

        {/* TAB 1: LIVE MONITORING DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Grid: Camera & Multi-modal Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <LiveCameraCard
                  isMonitoring={isMonitoring}
                  onVisionUpdate={handleVisionUpdate}
                  roomName={roomName}
                  lang={lang}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col">
                <RiskEngineCard
                  riskData={riskData}
                  visionData={visionData}
                  audioData={audioData}
                  simData={simData}
                  lang={lang}
                />
              </div>
            </div>

            {/* Middle Grid: 3D Holographic Room Model & Comparative Audit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6">
                <HolographicRoom3D
                  lang={lang}
                  selectedHazard={selectedHazardNode}
                  onSelectHazard={setSelectedHazardNode}
                />
              </div>

              <div className="lg:col-span-6">
                <RoomHazardAnalysisCard
                  lang={lang}
                />
              </div>
            </div>

            {/* Bottom Grid: Audio Monitoring + Voice Wellness + Environmental Sim */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <AudioMonitorCard
                  isMonitoring={isMonitoring}
                  onAudioUpdate={handleAudioUpdate}
                  lang={lang}
                />
              </div>

              <div className="lg:col-span-4">
                <VoiceWellnessCard
                  lang={lang}
                />
              </div>

              <div className="lg:col-span-4">
                <EnvironmentalSimulationCard
                  simData={simData}
                  onSimUpdate={handleSimUpdate}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 3D ROOM & HAZARD SCANNER */}
        {activeTab === 'scanner' && (
          <div className="space-y-6 animate-fade-in">
            <HolographicRoom3D
              lang={lang}
              selectedHazard={selectedHazardNode}
              onSelectHazard={setSelectedHazardNode}
            />
            <RoomHazardAnalysisCard
              lang={lang}
            />
          </div>
        )}

        {/* TAB 3: VOICE GUARDIAN & STRESS ANALYZER */}
        {activeTab === 'voice' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <VoiceWellnessCard
              lang={lang}
            />
            <AudioMonitorCard
              isMonitoring={isMonitoring}
              onAudioUpdate={handleAudioUpdate}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 4: ALERTS HISTORY */}
        {activeTab === 'alerts' && (
          <div className="animate-fade-in">
            <AlertHistoryTab lang={lang} />
          </div>
        )}

        {/* TAB 5: ENVIRONMENTAL SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <EnvironmentalSimulationCard
              simData={simData}
              onSimUpdate={handleSimUpdate}
              lang={lang}
            />
          </div>
        )}

        {/* TAB 6: HAZARD TESTING LAB */}
        {activeTab === 'testing' && (
          <div className="animate-fade-in">
            <TestingLabTab lang={lang} />
          </div>
        )}
      </main>

      {/* Critical Alert Emergency Modal */}
      <CriticalAlertModal
        alert={activeCriticalAlert}
        onAcknowledge={handleAcknowledgeAlert}
        emergencyContacts={contacts}
        lang={lang}
      />

      {/* Welcome Disaster Protection Guide Modal */}
      <WelcomeGuideModal
        lang={lang}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-black/90 py-5 px-6 text-center font-mono text-[11px] text-slate-500">
        GRIHINI RAKSHAK (गृहिणी रक्षक) • {t.tagline} • Software-Only Indoor Disaster Defense
      </footer>
    </div>
  );
}
