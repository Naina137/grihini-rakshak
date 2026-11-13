import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export default function AudioSpectrogram({
  isMicActive,
  hasPermission,
  errorMessage,
  decibels,
  onToggleMic,
  getFrequencyData,
  audioDetections
}) {
  const canvasRef = useRef(null);

  // Live Canvas Visualizer Loop
  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isMicActive && getFrequencyData) {
        const freqData = getFrequencyData();
        if (freqData) {
          const barWidth = (canvas.width / 48) - 1.5;
          let x = 0;

          for (let i = 0; i < 48; i++) {
            // Sample frequency bins
            const binIdx = Math.floor(i * (freqData.length / 48));
            const val = freqData[binIdx] || 0;
            const barHeight = (val / 255) * canvas.height * 0.9;

            // Gradient: cyan to red on high volume
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
            gradient.addColorStop(0, '#00F0FF');
            gradient.addColorStop(0.6, '#3B82F6');
            gradient.addColorStop(1, val > 200 ? '#EF4444' : '#60A5FA');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1.5;
          }
        }
      } else {
        // Idle flatline with subtle pulse
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isMicActive, getFrequencyData]);

  const hazardSounds = [
    { key: 'glass_breaking', label: 'Glass Breaking', score: audioDetections?.glass_breaking || 0, color: 'text-amber-400', bar: 'bg-amber-400' },
    { key: 'smoke_alarm', label: 'Smoke Alarm', score: audioDetections?.smoke_alarm || 0, color: 'text-red-400', bar: 'bg-red-400' },
    { key: 'fire_alarm', label: 'Fire Alarm', score: audioDetections?.fire_alarm || 0, color: 'text-rose-400', bar: 'bg-rose-400' },
    { key: 'screaming', label: 'Human Screaming', score: audioDetections?.screaming || 0, color: 'text-orange-400', bar: 'bg-orange-400' },
    { key: 'loud_impact', label: 'Loud Impact / Thud', score: audioDetections?.loud_impact || 0, color: 'text-yellow-400', bar: 'bg-yellow-400' }
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Acoustic Safety Guardian
              {isMicActive && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {decibels} dB
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">Continuous in-memory spectral analysis & hazard classification</p>
          </div>
        </div>

        {/* Mic Toggle Button */}
        <button
          onClick={onToggleMic}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isMicActive
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 glow-cyan'
          }`}
        >
          {isMicActive ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Mute Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Enable Mic</span>
            </>
          )}
        </button>
      </div>

      {/* Visualizer Canvas */}
      <div className="w-full h-24 bg-slate-950 rounded-xl border border-slate-800/80 p-2 flex flex-col justify-end relative overflow-hidden">
        <canvas ref={canvasRef} width={380} height={80} className="w-full h-full block" />
        {!isMicActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-xs text-slate-400">
            {errorMessage ? (
              <span className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {errorMessage}
              </span>
            ) : (
              "Microphone standby. Click 'Enable Mic' to activate acoustic listening."
            )}
          </div>
        )}
      </div>

      {/* Sound Classification Probabilities */}
      <div className="mt-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Acoustic Hazard Classifiers:</span>
          <span className="text-[10px] text-cyan-400 font-mono">CONFIDENCE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {hazardSounds.map((item) => {
            const pct = Math.round(item.score * 100);
            const isDanger = pct >= 60;
            return (
              <div 
                key={item.key} 
                className={`p-2 rounded-lg border text-xs transition-all ${
                  isDanger 
                    ? 'bg-red-500/20 border-red-500/50 glow-red animate-pulse' 
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-medium text-[11px]">{item.label}</span>
                  <span className={`font-mono text-[11px] font-bold ${isDanger ? 'text-red-400' : 'text-slate-400'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${isDanger ? 'bg-red-500' : item.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
