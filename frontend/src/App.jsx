import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LiveCameraCard from './components/LiveCameraCard';
import AudioMonitorCard from './components/AudioMonitorCard';
import RiskEngineCard from './components/RiskEngineCard';
import EnvironmentalSimulationCard from './components/EnvironmentalSimulationCard';
import CriticalAlertModal from './components/CriticalAlertModal';
import AlertHistoryTab from './components/AlertHistoryTab';
import TestingLabTab from './components/TestingLabTab';
import SettingsTab from './components/SettingsTab';
import { fetchAlerts, fetchContacts, fetchSimulationStatus, dismissCriticalModal } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [roomName, setRoomName] = useState('Living Room - Unit 4B');
  
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

  // Load initial contacts, alerts and simulation status
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
        if (aRes?.active_critical) setActiveCriticalAlert(aRes.active_critical);
        if (sRes?.readings) setSimData(sRes.readings);

        // Request browser Notification permission for emergency alerts
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (err) {
        console.warn('Initial load error:', err);
      }
    }
    init();
  }, []);

  // Handle updates from Vision component
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

  // Handle updates from Audio component
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

  // Handle updates from Simulation component
  const handleSimUpdate = useCallback((updatedSim) => {
    setSimData(updatedSim);
  }, []);

  // Trigger Critical Alert & Browser Push Notification
  const triggerCriticalAlert = (alertObj) => {
    setActiveCriticalAlert(alertObj);
    setRecentAlertsCount(prev => prev + 1);

    // Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SENTINEL AI - CRITICAL HAZARD ALERT', {
        body: `Emergency in ${alertObj.room_name}: ${(alertObj.hazards || []).join(', ')}`,
        icon: '/vite.svg',
        tag: alertObj.id
      });
    }
  };

  // Acknowledge Modal
  const handleAcknowledgeAlert = async (alertId, actionType) => {
    setActiveCriticalAlert(null);
    await dismissCriticalModal().catch(() => {});
    setRiskData(prev => ({ ...prev, risk_level: 'NORMAL', risk_score: 15.0, hazards: [] }));
    setRecentAlertsCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-navy-950">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        riskLevel={riskData.risk_level}
        isMonitoring={isMonitoring}
        toggleMonitoring={() => setIsMonitoring(!isMonitoring)}
        roomName={roomName}
        alertCount={recentAlertsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: LIVE MONITORING DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Grid: Live Vision + Risk Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Camera Feed Card (7 cols) */}
              <div className="lg:col-span-7">
                <LiveCameraCard
                  isMonitoring={isMonitoring}
                  onVisionUpdate={handleVisionUpdate}
                  roomName={roomName}
                />
              </div>

              {/* Risk Engine Card (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <RiskEngineCard
                  riskData={riskData}
                  visionData={visionData}
                  audioData={audioData}
                  simData={simData}
                />
              </div>
            </div>

            {/* Bottom Grid: Audio Monitoring + Environmental Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Audio Monitor Card (6 cols) */}
              <div className="lg:col-span-6">
                <AudioMonitorCard
                  isMonitoring={isMonitoring}
                  onAudioUpdate={handleAudioUpdate}
                />
              </div>

              {/* Environmental Simulation Card (6 cols) */}
              <div className="lg:col-span-6">
                <EnvironmentalSimulationCard
                  simData={simData}
                  onSimUpdate={handleSimUpdate}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ALERTS HISTORY */}
        {activeTab === 'alerts' && (
          <AlertHistoryTab />
        )}

        {/* TAB 3: ENVIRONMENTAL SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <EnvironmentalSimulationCard
              simData={simData}
              onSimUpdate={handleSimUpdate}
            />
          </div>
        )}

        {/* TAB 4: HAZARD TESTING LAB */}
        {activeTab === 'testing' && (
          <TestingLabTab />
        )}

        {/* TAB 5: CONTACTS & SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsTab
            roomName={roomName}
            setRoomName={setRoomName}
          />
        )}
      </main>

      {/* Fullscreen Critical Hazard Emergency Modal */}
      <CriticalAlertModal
        alert={activeCriticalAlert}
        onAcknowledge={handleAcknowledgeAlert}
        emergencyContacts={contacts}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-6 text-center font-mono text-[11px] text-slate-500">
        SENTINEL AI • Intelligent Software-Only Indoor Safety Monitoring • Your Room. Your Safety. Your AI Guardian.
      </footer>
    </div>
  );
}
