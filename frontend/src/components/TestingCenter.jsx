import React, { useState } from 'react';
import { 
  FlaskConical, 
  Flame, 
  Wind, 
  Volume2, 
  BellRing, 
  User, 
  CameraOff, 
  MicOff, 
  WifiOff, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { API_BASE } from '../utils/constants';
import { playSyntheticHazard } from '../utils/audioSynthesizer';

export default function TestingCenter({ onSimulateNetworkDrop, onSimulateCameraFail, onSimulateMicFail }) {
  const [testResults, setTestResults] = useState({});
  const [runningTest, setRunningTest] = useState(null);
  const [runningAll, setRunningAll] = useState(false);

  const tests = [
    {
      id: 'fire',
      title: 'Fire Detection Algorithm Test',
      icon: Flame,
      color: 'text-red-400',
      description: 'Evaluates dual color-space modeling (HSV + YCrCb) against high-roughness turbulent flames and verifies static light suppression.',
      hasAudio: false
    },
    {
      id: 'smoke',
      title: 'Smoke Detection Algorithm Test',
      icon: Wind,
      color: 'text-sky-400',
      description: 'Synthesizes diffuse gray low-chrominance dispersion cloud and analyzes contour clustering and edge blurring.',
      hasAudio: false
    },
    {
      id: 'glass',
      title: 'Glass Breaking Acoustic Test',
      icon: Volume2,
      color: 'text-amber-400',
      description: 'Verifies sharp 4.8kHz - 8kHz brittle acoustic transient classification. Click Play to hear the synthesized shatter.',
      hasAudio: true,
      audioHazard: 'glass'
    },
    {
      id: 'alarm',
      title: 'Smoke / Fire Alarm Sound Test',
      icon: BellRing,
      color: 'text-rose-400',
      description: 'Tests 3.1kHz piezoelectric pulsed T3 smoke detector siren detection. Click Play to emit the audible test alarm.',
      hasAudio: true,
      audioHazard: 'alarm'
    },
    {
      id: 'human',
      title: 'Human Occupancy Detection Test',
      icon: User,
      color: 'text-cyan-400',
      description: 'Evaluates person classifier geometry, head-torso aspect ratios, and foreground silhouette analysis.',
      hasAudio: false
    },
    {
      id: 'camera_failure',
      title: 'Camera Permission Failure Resilience',
      icon: CameraOff,
      color: 'text-slate-400',
      description: 'Simulates browser camera permission refusal (NotAllowedError) and verifies graceful user alert and retry controls.',
      hasAudio: false,
      isSim: true,
      action: onSimulateCameraFail
    },
    {
      id: 'mic_failure',
      title: 'Microphone Denial Resilience Test',
      icon: MicOff,
      color: 'text-slate-400',
      description: 'Simulates microphone permission denial and verifies audio watchdog fallback without application crash.',
      hasAudio: false,
      isSim: true,
      action: onSimulateMicFail
    },
    {
      id: 'network_failure',
      title: 'Network Drop & WebSocket Reconnect',
      icon: WifiOff,
      color: 'text-slate-400',
      description: 'Simulates sudden socket disruption and validates automatic exponential backoff auto-reconnection.',
      hasAudio: false,
      isSim: true,
      action: onSimulateNetworkDrop
    }
  ];

  const runTest = async (testId) => {
    try {
      setRunningTest(testId);
      const res = await fetch(`${API_BASE}/testing/run-test/${testId}`, { method: 'POST' });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [testId]: data }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [testId]: { passed: false, error: e.message || 'Test execution failure' }
      }));
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    try {
      setRunningAll(true);
      for (const t of tests) {
        if (!t.isSim) {
          await runTest(t.id);
        }
      }
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Safety Testing & Simulation Diagnostic Center
          </h2>
          <p className="text-xs text-slate-400">
            Automated verification suite for all 8 mandatory safety drills: fire, smoke, glass, alarms, occupancy, and failure resilience.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={runningAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 glow-cyan transition shadow-lg cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${runningAll ? 'animate-spin' : ''}`} />
          <span>{runningAll ? 'Executing Diagnostic Suite...' : 'Run All Diagnostic Tests'}</span>
        </button>
      </div>

      {/* Grid of Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {tests.map((test) => {
          const Icon = test.icon;
          const result = testResults[test.id];
          const isRunning = runningTest === test.id;

          return (
            <div
              key={test.id}
              className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-cyan-500/30 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                      <Icon className={`w-4 h-4 ${test.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{test.title}</h3>
                      <span className="text-[10px] uppercase font-mono text-cyan-400">
                        {test.isSim ? 'Resilience Drill' : 'AI Model Verification'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {result && (
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      result.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}>
                      {result.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-2 mb-3">
                  {test.description}
                </p>

                {/* Test Result details if available */}
                {result && (
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 mb-3 space-y-1">
                    <div className="text-cyan-400 font-semibold">{result.details || result.ui_instruction}</div>
                    {result.confidence !== undefined && (
                      <div className="text-slate-400">
                        Detection Confidence: <span className="text-slate-100 font-bold">{Math.round(result.confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => runTest(test.id)}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running Diagnostic...' : 'Execute Test'}</span>
                </button>

                {test.hasAudio && (
                  <button
                    onClick={() => playSyntheticHazard(test.audioHazard)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer glow-orange"
                    title="Synthesizes sound out loud through speakers"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Audible Sound</span>
                  </button>
                )}

                {test.action && (
                  <button
                    onClick={test.action}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    <span>Trigger In UI</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
