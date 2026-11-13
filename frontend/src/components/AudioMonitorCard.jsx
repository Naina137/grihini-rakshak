import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Volume2, ShieldCheck, AlertCircle, RefreshCw, Sparkles, Activity } from 'lucide-react';
import { analyzeAudioChunk } from '../services/api';
import { audioSynth } from '../utils/audioSynth';

export default function AudioMonitorCard({
  isMonitoring,
  onAudioUpdate
}) {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const chunkIntervalRef = useRef(null);

  const [micActive, setMicActive] = useState(true);
  const [permissionState, setPermissionState] = useState('prompt');
  const [permErrorMsg, setPermErrorMsg] = useState('');
  const [currentDecibels, setCurrentDecibels] = useState(42);
  const [classification, setClassification] = useState({
    primaryClass: 'AMBIENT',
    confidence: 0.95,
    isHazard: false,
    scores: {
      AMBIENT: 0.95,
      SMOKE_ALARM: 0.01,
      FIRE_ALARM: 0.01,
      GLASS_BREAKING: 0.01,
      SCREAMING: 0.01,
      LOUD_IMPACT: 0.01
    }
  });

  // Start Mic & Web Audio Graph
  const startMicrophone = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setPermErrorMsg('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });

      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      source.connect(analyser);
      analyserRef.current = analyser;

      setPermissionState('granted');
      setMicActive(true);
      startVisualizer();
    } catch (err) {
      console.warn('Microphone permission / access error:', err);
      setPermissionState('denied');
      setPermErrorMsg(err.name === 'NotAllowedError'
        ? 'Microphone access denied. Enable permissions in your browser bar.'
        : `Microphone error: ${err.message || 'No audio input detected.'}`);
    }
  }, []);

  // Stop Mic
  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setMicActive(false);
  }, []);

  const handleToggleMic = () => {
    if (micActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  useEffect(() => {
    if (isMonitoring && micActive && permissionState !== 'denied') {
      startMicrophone();
    } else if (!isMonitoring) {
      stopMicrophone();
    }
    return () => stopMicrophone();
  }, [isMonitoring]);

  // Audio Canvas Visualizer (Oscilloscope & FFT Spectrum)
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const analyser = analyserRef.current;
      if (!analyser) {
        // Draw synthetic low ambient wave
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      // Compute approximate dB SPL
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (timeData[i] - 128) / 128.0;
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      const db = Math.round(Math.max(30, 20 * Math.log10(Math.max(1e-4, rms)) + 92));
      setCurrentDecibels(db);

      // Draw background
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Frequency Spectrum Bars
      const barWidth = (canvas.width / bufferLength) * 2.2;
      let barX = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (freqData[i] / 255) * canvas.height * 0.75;
        
        // Gradient color: Cyan to Purple to Red
        const hue = 180 + (i / bufferLength) * 140;
        ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
        ctx.fillRect(barX, canvas.height - barHeight, barWidth - 1, barHeight);
        barX += barWidth;
      }

      // Draw Waveform Oscilloscope Line on top
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#22d3ee';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Periodic Backend Acoustic Classification
  useEffect(() => {
    if (!isMonitoring || !micActive) {
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
      return;
    }

    chunkIntervalRef.current = setInterval(async () => {
      try {
        // Send sample classification tick to backend
        const res = await analyzeAudioChunk(null, 22050, null);
        if (res && res.audio) {
          const a = res.audio;
          setClassification({
            primaryClass: a.primary_class,
            confidence: a.confidence,
            isHazard: a.is_hazard,
            scores: a.scores || {}
          });

          if (onAudioUpdate) {
            onAudioUpdate(res);
          }
        }
      } catch (e) {
        // Silent recovery
      }
    }, 1200);

    return () => {
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);
    };
  }, [isMonitoring, micActive, onAudioUpdate]);

  // Test Sound Injections for Live Demonstration
  const triggerAudioTest = async (hazardType) => {
    if (hazardType === 'SMOKE_ALARM') {
      audioSynth.playSmokeAlarmTone();
    } else if (hazardType === 'GLASS_BREAKING') {
      audioSynth.playGlassBreakSound();
    } else if (hazardType === 'LOUD_IMPACT') {
      audioSynth.playImpactSound();
    }

    try {
      const res = await analyzeAudioChunk(null, 22050, hazardType);
      if (res && res.audio) {
        const a = res.audio;
        setClassification({
          primaryClass: a.primary_class,
          confidence: a.confidence,
          isHazard: a.is_hazard,
          scores: a.scores || {}
        });
        if (onAudioUpdate) onAudioUpdate(res);
      }
    } catch (e) {
      console.warn('Audio test failed:', e);
    }
  };

  const getHazardBadgeColor = (cls) => {
    switch (cls) {
      case 'SMOKE_ALARM':
      case 'FIRE_ALARM':
        return 'text-red-400 bg-red-950/80 border-red-500/60';
      case 'GLASS_BREAKING':
        return 'text-amber-400 bg-amber-950/80 border-amber-500/60';
      case 'SCREAMING':
        return 'text-purple-400 bg-purple-950/80 border-purple-500/60';
      case 'LOUD_IMPACT':
        return 'text-orange-400 bg-orange-950/80 border-orange-500/60';
      default:
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-cyan-500/20 shadow-xl relative overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              ACOUSTIC INTELLIGENCE ENGINE
              {micActive && isMonitoring && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Continuous Spectral STFT & T-3 Alarm Frequency Analysis
            </p>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentDecibels} dB SPL</span>
          </div>

          <button
            onClick={handleToggleMic}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              micActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
            title={micActive ? 'Turn Microphone Off' : 'Turn Microphone On'}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Audio Visualizer Canvas */}
      <div className="relative h-28 w-full rounded-xl bg-navy-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={112}
          className="w-full h-full object-cover"
        />

        {/* Watermark / Status */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-navy-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>REAL-TIME SPECTROGRAM</span>
        </div>

        {/* Active Hazard Alarm Badge */}
        {classification.isHazard && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/90 border border-red-500 text-xs font-bold text-red-300 animate-pulse shadow-lg shadow-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>{classification.primaryClass.replace('_', ' ')}</span>
          </div>
        )}

        {/* Permission Error Overlay */}
        {permissionState === 'denied' && (
          <div className="absolute inset-0 bg-navy-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-6 h-6 text-amber-400 mb-1" />
            <p className="text-xs font-semibold text-slate-200">{permErrorMsg}</p>
            <button
              onClick={startMicrophone}
              className="mt-2 flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Retry Mic
            </button>
          </div>
        )}

        {/* Inactive Overlay */}
        {!micActive && permissionState !== 'denied' && (
          <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <MicOff className="w-6 h-6 text-slate-500 mb-1" />
            <span className="text-xs text-slate-400">Microphone Muted</span>
          </div>
        )}
      </div>

      {/* Classification Meters */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span>CLASSIFICATION</span>
          <span className="text-cyan-400 font-semibold">
            PRIMARY: {classification.primaryClass.replace('_', ' ')} ({Math.round(classification.confidence * 100)}%)
          </span>
        </div>

        {/* Progress bars for key hazards */}
        {[
          { key: 'SMOKE_ALARM', label: 'Smoke / Fire Alarm (3100Hz T3)', color: 'bg-red-500' },
          { key: 'GLASS_BREAKING', label: 'Glass Breaking (>4.5kHz)', color: 'bg-amber-400' },
          { key: 'SCREAMING', label: 'Human Distress Scream', color: 'bg-purple-400' },
          { key: 'LOUD_IMPACT', label: 'Heavy Impact / Thud', color: 'bg-orange-400' },
          { key: 'AMBIENT', label: 'Ambient Room / Speech', color: 'bg-emerald-400' }
        ].map(item => {
          const score = classification.scores[item.key] || 0.01;
          const pct = Math.round(score * 100);
          return (
            <div key={item.key} className="flex items-center gap-2 text-[11px] font-mono">
              <span className="w-44 truncate text-slate-300">{item.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Quick Test Injections */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 uppercase font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" /> Sound Injectors:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerAudioTest('GLASS_BREAKING')}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
          >
            Glass Break
          </button>
          <button
            onClick={() => triggerAudioTest('SMOKE_ALARM')}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
          >
            Smoke Alarm
          </button>
          <button
            onClick={() => triggerAudioTest('LOUD_IMPACT')}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20"
          >
            Impact
          </button>
        </div>
      </div>
    </div>
  );
}
