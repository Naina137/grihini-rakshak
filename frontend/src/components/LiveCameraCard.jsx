import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Video, AlertCircle, RefreshCw, Eye, Sparkles, Download, Layers } from 'lucide-react';
import { analyzeFrame } from '../services/api';

export default function LiveCameraCard({
  isMonitoring,
  onVisionUpdate,
  roomName = 'Living Room - Unit 4B'
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(true);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [permErrorMsg, setPermErrorMsg] = useState('');
  const [isSimulationStream, setIsSimulationStream] = useState(false);
  const [visionStats, setVisionStats] = useState({
    fps: 0,
    latencyMs: 0,
    peopleCount: 0,
    fireDetected: false,
    fireConf: 0,
    smokeDetected: false,
    smokeConf: 0,
    motionScore: 0,
    boxesCount: 0
  });

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setPermErrorMsg('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
      setPermissionState('granted');
      setCameraActive(true);
      setIsSimulationStream(false);
    } catch (err) {
      console.warn('Camera permission / start error:', err);
      setPermissionState('denied');
      setPermErrorMsg(err.name === 'NotAllowedError' 
        ? 'Camera access denied by browser policy. Enable permissions in address bar or test with Synthetic Chamber Stream.' 
        : `Camera error: ${err.message || 'No video input device detected.'}`);
    }
  }, []);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Toggle Camera
  const handleToggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      if (isSimulationStream) {
        setCameraActive(true);
      } else {
        startCamera();
      }
    }
  };

  // Toggle Synthetic Simulation Stream
  const handleToggleSimulationStream = () => {
    if (!isSimulationStream) {
      stopCamera();
      setIsSimulationStream(true);
      setCameraActive(true);
      setPermissionState('granted');
    } else {
      setIsSimulationStream(false);
      startCamera();
    }
  };

  // Initialize camera when monitoring starts
  useEffect(() => {
    if (isMonitoring && cameraActive && !isSimulationStream && permissionState !== 'denied') {
      startCamera();
    } else if (!isMonitoring) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isMonitoring]);

  // Frame Capture & Inference Loop (2.5 FPS)
  useEffect(() => {
    if (!isMonitoring || !cameraActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    let lastTime = performance.now();
    let frameCounter = 0;

    intervalRef.current = setInterval(async () => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      frameCounter++;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      let b64Image = '';

      if (isSimulationStream || !video || video.readyState < 2) {
        // Render synthetic test room with oscillating test flame
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, 0, w, h);
        
        // Draw room perspective lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w * 0.2, h * 0.2);
        ctx.moveTo(w, 0); ctx.lineTo(w * 0.8, h * 0.2);
        ctx.stroke();

        // Draw dynamic flickering flame
        const flicker = Math.sin(frameCounter * 0.8) * 15;
        const cx = w * 0.5;
        const cy = h * 0.6;
        
        ctx.save();
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 25;
        
        // Outer flame
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(cx - 35, cy + 40);
        ctx.quadraticCurveTo(cx - 20, cy - 20, cx, cy - 70 + flicker);
        ctx.quadraticCurveTo(cx + 20, cy - 20, cx + 35, cy + 40);
        ctx.closePath();
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy + 35);
        ctx.quadraticCurveTo(cx - 10, cy, cx, cy - 40 + flicker * 0.6);
        ctx.quadraticCurveTo(cx + 10, cy, cx + 18, cy + 35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        b64Image = canvas.toDataURL('image/jpeg', 0.85);
      } else {
        // Draw real webcam video onto canvas
        ctx.drawImage(video, 0, 0, w, h);
        b64Image = canvas.toDataURL('image/jpeg', 0.75);
      }

      // Send to Backend Inference API
      try {
        const startT = performance.now();
        const data = await analyzeFrame(b64Image, roomName);
        const latency = Math.round(performance.now() - startT);

        if (data && data.vision) {
          const v = data.vision;
          setVisionStats({
            fps: Math.round(1 / (deltaSec || 0.4)),
            latencyMs: latency,
            peopleCount: v.people?.count || 0,
            fireDetected: v.fire?.detected || false,
            fireConf: v.fire?.confidence || 0,
            smokeDetected: v.smoke?.detected || false,
            smokeConf: v.smoke?.confidence || 0,
            motionScore: v.motion?.motion_score || 0,
            boxesCount: v.boxes?.length || 0
          });

          // Draw Bounding Boxes on Overlay Canvas
          drawBoundingBoxes(ctx, v.boxes || [], w, h);

          if (onVisionUpdate) {
            onVisionUpdate(data);
          }
        }
      } catch (err) {
        // Graceful handle of temporary frame drop
      }
    }, 450); // ~2.2 FPS optimal for CV inference

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMonitoring, cameraActive, isSimulationStream, roomName, onVisionUpdate]);

  // Helper to draw detection bounding boxes & confidence tags
  const drawBoundingBoxes = (ctx, boxes, canvasW, canvasH) => {
    boxes.forEach(box => {
      const color = box.color || '#06b6d4';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = color;

      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Label badge
      const label = `${box.label || box.category.toUpperCase()} ${box.confidence ? `(${Math.round(box.confidence * 100)}%)` : ''}`;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(label).width;

      ctx.fillRect(box.x, Math.max(0, box.y - 18), textWidth + 8, 18);
      ctx.fillStyle = '#060a14';
      ctx.fillText(label, box.x + 4, Math.max(12, box.y - 4));
    });
  };

  // Snapshot frame capture
  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `sentinel-frame-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-cyan-500/20 shadow-xl relative overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              LIVE COMPUTER VISION
              {cameraActive && isMonitoring && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {isSimulationStream ? 'Synthetic Test Flame Stream' : 'Live Device Optical Feed'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleSimulationStream}
            title={isSimulationStream ? "Switch to Real Camera" : "Switch to Simulation Stream"}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all ${
              isSimulationStream
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            {isSimulationStream ? 'Sim Stream Active' : 'Sim Stream'}
          </button>

          <button
            onClick={handleToggleCamera}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              cameraActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
            title={cameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {cameraActive ? <Video className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCaptureSnapshot}
            disabled={!cameraActive || !isMonitoring}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-cyan-300 disabled:opacity-40"
            title="Download Snapshot"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport & Canvas Overlay */}
      <div className="relative aspect-video w-full rounded-xl bg-navy-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        
        {/* Hidden video element for webcam capture */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
        />

        {/* Render Canvas with Detections */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive && isMonitoring ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* Watermark / HUD Overlay */}
        {cameraActive && isMonitoring && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-navy-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>AI SCANNING</span>
            <span className="text-slate-400">|</span>
            <span>{visionStats.fps} FPS</span>
            <span className="text-slate-400">|</span>
            <span>{visionStats.latencyMs}ms</span>
          </div>
        )}

        {/* Hazard Target HUD Tag */}
        {visionStats.fireDetected && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/90 border border-red-500 text-xs font-bold text-red-300 animate-bounce shadow-lg shadow-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>FLAME DETECTED ({Math.round(visionStats.fireConf * 100)}%)</span>
          </div>
        )}

        {/* Permission Denied Fallback UI */}
        {permissionState === 'denied' && !isSimulationStream && (
          <div className="absolute inset-0 bg-navy-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-100 mb-1">Camera Permission Blocked</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {permErrorMsg}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Permission
              </button>
              <button
                onClick={handleToggleSimulationStream}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run Synthetic Stream
              </button>
            </div>
          </div>
        )}

        {/* Inactive Overlay */}
        {(!cameraActive || !isMonitoring) && permissionState !== 'denied' && (
          <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <CameraOff className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              {!isMonitoring ? 'Monitoring Inactive' : 'Camera Powered Off'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click 'ARM GUARD' or turn camera ON to resume visual surveillance.
            </p>
          </div>
        )}
      </div>

      {/* Detection Metrics Footer */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">FLAME</div>
          <div className={`text-xs font-bold ${visionStats.fireDetected ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {visionStats.fireDetected ? `${Math.round(visionStats.fireConf * 100)}%` : 'CLEAR'}
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">SMOKE</div>
          <div className={`text-xs font-bold ${visionStats.smokeDetected ? 'text-slate-300' : 'text-emerald-400'}`}>
            {visionStats.smokeDetected ? `${Math.round(visionStats.smokeConf * 100)}%` : 'CLEAR'}
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">OCCUPANTS</div>
          <div className="text-xs font-bold text-cyan-400">
            {visionStats.peopleCount} {visionStats.peopleCount === 1 ? 'PERSON' : 'PEOPLE'}
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400">MOTION</div>
          <div className={`text-xs font-bold ${visionStats.motionScore > 0.5 ? 'text-amber-400' : 'text-slate-300'}`}>
            {Math.round(visionStats.motionScore * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
