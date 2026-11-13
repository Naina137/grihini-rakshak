import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LiveMonitor from './components/LiveMonitor';
import RiskGauge from './components/RiskGauge';
import AudioSpectrogram from './components/AudioSpectrogram';
import EnvironmentalSensors from './components/EnvironmentalSensors';
import CriticalAlertModal from './components/CriticalAlertModal';
import AlertHistory from './components/AlertHistory';
import EmergencyContacts from './components/EmergencyContacts';
import TestingCenter from './components/TestingCenter';
import SettingsView from './components/SettingsView';

import { useCamera } from './hooks/useCamera';
import { useMicrophone } from './hooks/useMicrophone';
import { useSentinelSocket } from './hooks/useSentinelSocket';
import { API_BASE } from './utils/constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeRoom, setActiveRoom] = useState("Living Area & Home Office");

  // Telemetry state from backend
  const [riskState, setRiskState] = useState(null);
  const [activeAlertModal, setActiveAlertModal] = useState(null);
  const [alertStats, setAlertStats] = useState({ total_alerts: 0, unacknowledged_count: 0 });

  // Hooks
  const camera = useCamera();
  const mic = useMicrophone();

  // Alert & Telemetry callbacks
  const handleNewAlert = useCallback((alertData) => {
    setActiveAlertModal(alertData);
    fetchStats();
  }, []);

  const handleTelemetryUpdate = useCallback((data) => {
    setRiskState(data);
    // If telemetry shows CRITICAL or HIGH RISK, trigger modal if not already active
    if ((data.risk_level === 'CRITICAL' || data.risk_level === 'HIGH RISK') && data.active_hazards && data.active_hazards.length > 0) {
      setActiveAlertModal(prev => prev || {
        risk_level: data.risk_level,
        hazard_type: data.primary_threat || data.active_hazards[0],
        room_name: activeRoom,
        combined_score: data.combined_score,
        summary: `Immediate multi-modal hazard convergence: ${data.active_hazards.join(', ')}`
      });
    }
  }, [activeRoom]);

  const socket = useSentinelSocket({
    onNewAlert: handleNewAlert,
    onTelemetryUpdate: handleTelemetryUpdate
  });

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/alerts/stats`);
      const data = await res.json();
      setAlertStats(data);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Master Surveillance Toggle
  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      // STOP MONITORING
      camera.stopCamera();
      mic.stopMicrophone();
      setIsMonitoring(false);
      setRiskState(null);
    } else {
      // START MONITORING
      await camera.startCamera();
      await mic.startMicrophone();
      setIsMonitoring(true);
    }
  };

  // Continuous Surveillance Streaming Loop
  // Captures camera frame + in-memory audio chunk every 400ms and sends to backend
  const streamTimerRef = useRef(null);

  useEffect(() => {
    if (!isMonitoring) {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      return;
    }

    streamTimerRef.current = setInterval(async () => {
      const frameB64 = camera.captureFrameBase64();
      const audioB64 = mic.getLatestPcmChunk();

      // If WebSocket connected, stream via WebSocket
      if (socket.isConnected) {
        socket.sendPacket(frameB64, audioB64);
      } else {
        // Fallback to HTTP POST /fuse
        try {
          const res = await fetch(`${API_BASE}/monitor/fuse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_base64: frameB64 || '',
              pcm_base64: audioB64 || ''
            })
          });
          if (res.ok) {
            const data = await res.json();
            handleTelemetryUpdate(data);
          }
        } catch (e) {
          // Socket reconnecting
        }
      }
    }, 450);

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isMonitoring, socket.isConnected, camera, mic, handleTelemetryUpdate]);

  // Alert Acknowledge callback
  const handleAcknowledgeAlert = async (alertId) => {
    if (alertId) {
      try {
        await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acknowledged_by: "Security Operator" })
        });
      } catch (e) {}
    }
    setActiveAlertModal(null);
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Top Navigation */}
      <Navbar
        isMonitoring={isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        currentRiskLevel={riskState?.risk_level || 'NORMAL'}
        activeRoom={activeRoom}
        onChangeRoom={setActiveRoom}
        wsConnected={socket.isConnected}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          alertCounts={alertStats}
          isMonitoring={isMonitoring}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              {/* Primary Top Grid: Camera Feed + Risk Engine Gauge */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  <LiveMonitor
                    videoRef={camera.videoRef}
                    isCameraActive={camera.isCameraActive}
                    hasPermission={camera.hasPermission}
                    errorMessage={camera.errorMessage}
                    fps={camera.fps}
                    onToggleCamera={camera.toggleCamera}
                    visualDetections={riskState?.visual_evidence}
                  />
                </div>

                <div className="lg:col-span-1">
                  <RiskGauge riskState={riskState} />
                </div>
              </div>

              {/* Secondary Bottom Grid: Audio Spectrogram + Simulated Environmental Suite */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <AudioSpectrogram
                  isMicActive={mic.isMicActive}
                  hasPermission={mic.hasPermission}
                  errorMessage={mic.errorMessage}
                  decibels={mic.decibels}
                  onToggleMic={mic.toggleMicrophone}
                  getFrequencyData={mic.getFrequencyData}
                  audioDetections={riskState?.audio_evidence}
                />

                <EnvironmentalSensors
                  sensorData={riskState?.environmental_evidence}
                  onSensorUpdate={(newEnv) => {
                    setRiskState(prev => prev ? { ...prev, environmental_evidence: newEnv } : null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Alert History Tab */}
          {activeTab === 'alerts' && (
            <div className="max-w-7xl mx-auto">
              <AlertHistory onRefreshStats={fetchStats} />
            </div>
          )}

          {/* Environmental Telemetry Tab */}
          {activeTab === 'sensors' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <EnvironmentalSensors
                sensorData={riskState?.environmental_evidence}
                onSensorUpdate={(newEnv) => {
                  setRiskState(prev => prev ? { ...prev, environmental_evidence: newEnv } : null);
                }}
              />
            </div>
          )}

          {/* Testing Center Tab */}
          {activeTab === 'testing' && (
            <div className="max-w-6xl mx-auto">
              <TestingCenter
                onSimulateNetworkDrop={socket.simulateNetworkDrop}
                onSimulateCameraFail={() => camera.stopCamera()}
                onSimulateMicFail={() => mic.stopMicrophone()}
              />
            </div>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="max-w-6xl mx-auto">
              <EmergencyContacts />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-5xl mx-auto">
              <SettingsView activeRoom={activeRoom} onChangeRoom={setActiveRoom} />
            </div>
          )}
        </main>
      </div>

      {/* Critical Emergency Alert Modal Overlay */}
      {activeAlertModal && (
        <CriticalAlertModal
          alert={activeAlertModal}
          onAcknowledge={handleAcknowledgeAlert}
          onDismiss={() => setActiveAlertModal(null)}
        />
      )}
    </div>
  );
}
