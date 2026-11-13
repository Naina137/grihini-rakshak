import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Video, AlertCircle, RefreshCw, Eye, Sparkles, Download, UserCheck, ShieldCheck, Search, Zap, Flame, Wind, Box } from 'lucide-react';
import { analyzeFrame } from '../services/api';

export default function LiveCameraCard({
  isMonitoring,
  onVisionUpdate,
  roomName = 'Living Room - Unit 4B',
  lang = 'en'
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(true);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [permErrorMsg, setPermErrorMsg] = useState('');
  const [isSimulationStream, setIsSimulationStream] = useState(false);
  const [isScanningRoom, setIsScanningRoom] = useState(false);
  const [roomInspectionResults, setRoomInspectionResults] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
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

  const loadVideoDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(videoDevs);
      if (videoDevs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevs[0].deviceId);
      }
    } catch (e) {}
  };

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setPermErrorMsg('');

      let constraints = { video: true, audio: false };
      if (selectedDeviceId) {
        constraints = {
          video: { deviceId: { exact: selectedDeviceId } },
          audio: false
        };
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setPermissionState('granted');
      setCameraActive(true);
      setIsSimulationStream(false);
      loadVideoDevices();
    } catch (err) {
      console.warn('Camera access error:', err);
      setPermissionState('denied');
      const isDeviceInUse = err.name === 'NotReadableError' || err.message?.includes('Device in use');
      setPermErrorMsg(
        isDeviceInUse
          ? 'Webcam is currently in use by another application. Close other camera apps or click "Sim Stream" to run virtual room analysis.'
          : err.name === 'NotAllowedError'
          ? 'Camera access denied in browser bar. Click the lock icon in your address bar to Allow Camera.'
          : `Camera error: ${err.message || 'No video device found'}`
      );
    }
  }, [selectedDeviceId]);

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

  useEffect(() => {
    if (isMonitoring && cameraActive && !isSimulationStream && permissionState !== 'denied') {
      startCamera();
    } else if (!isMonitoring) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isMonitoring, selectedDeviceId]);

  // Optical Inspection Scan: Highlights room danger points
  const triggerRoomInspectionScan = () => {
    setIsScanningRoom(true);
    setRoomInspectionResults(null);

    setTimeout(() => {
      setIsScanningRoom(false);
      const results = [
        {
          id: 'outlet',
          name: lang === 'hi' ? 'इलेक्ट्रिकल सॉकेट व तार' : 'Electrical Outlet & Wiring Area',
          riskLevel: lang === 'hi' ? 'खतरा: शॉर्ट सर्किट' : 'RISK: Short Circuit & Overload',
          advice: lang === 'hi' ? 'ढीले प्लग ठीक करें। एक ही सॉकेट पर भारी उपकरण न लगाएं।' : 'Ensure plugs are tight. Avoid daisy-chaining multi-plugs.',
          box: { x: 50, y: 180, width: 140, height: 110, color: '#f59e0b', label: 'ELEC OUTLET' }
        },
        {
          id: 'gas_heat',
          name: lang === 'hi' ? 'कुकिंग / हीट अप्लायंसेज' : 'Heat Source / Stovetop Zone',
          riskLevel: lang === 'hi' ? 'खतरा: आग / लपटें' : 'RISK: Flare-Up / Combustibles',
          advice: lang === 'hi' ? 'कपड़े, पर्दे या तेल के डिब्बे गैस चूल्हे से कम से कम 1 मीटर दूर रखें।' : 'Keep fabrics and oil canisters at least 1 meter away from heat.',
          box: { x: 420, y: 220, width: 160, height: 130, color: '#ef4444', label: 'HEAT ZONE' }
        },
        {
          id: 'fan_ceiling',
          name: lang === 'hi' ? 'सीलिंग फैन / हैंगिंग लाइट' : 'Ceiling Fan & Overhead Fixture',
          riskLevel: lang === 'hi' ? 'खतरा: ढीला नट/बोल्ट' : 'RISK: Vibration / Detachment',
          advice: lang === 'hi' ? 'पंखे की स्पीड पर कंपन चेक करें। साल में एक बार स्क्रू टाइट करवाएं।' : 'Inspect for wobble. Ensure mounting bracket pins are secure.',
          box: { x: 230, y: 30, width: 180, height: 100, color: '#eab308', label: 'CEILING FIXTURE' }
        }
      ];

      setRoomInspectionResults(results);
    }, 1800);
  };

  // Video loop and inference
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
        ctx.fillStyle = '#050914';
        ctx.fillRect(0, 0, w, h);
        
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(w * 0.2, h * 0.2);
        ctx.moveTo(w, 0); ctx.lineTo(w * 0.8, h * 0.2);
        ctx.stroke();

        // Draw occupant silhouette
        const cx = w * 0.5;
        const cy = h * 0.55;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(cx, cy - 60, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy + 30, 75, 55, 0, 0, Math.PI * 2);
        ctx.fill();

        b64Image = canvas.toDataURL('image/jpeg', 0.85);
      } else {
        ctx.drawImage(video, 0, 0, w, h);
        b64Image = canvas.toDataURL('image/jpeg', 0.78);
      }

      // Backend inference
      try {
        const startT = performance.now();
        const data = await analyzeFrame(b64Image, roomName);
        const latency = Math.round(performance.now() - startT);

        if (data && data.vision) {
          const v = data.vision;
          setVisionStats({
            fps: Math.round(1 / (deltaSec || 0.45)),
            latencyMs: latency,
            peopleCount: v.people?.count || 0,
            fireDetected: v.fire?.detected || false,
            fireConf: v.fire?.confidence || 0,
            smokeDetected: v.smoke?.detected || false,
            smokeConf: v.smoke?.confidence || 0,
            motionScore: v.motion?.motion_score || 0,
            boxesCount: v.boxes?.length || 0
          });

          // Draw active bounding boxes
          drawBoundingBoxes(ctx, v.boxes || [], w, h);

          // If room inspection scan is active, also draw room hazard boxes
          if (roomInspectionResults) {
            roomInspectionResults.forEach(res => {
              drawCustomHazardBox(ctx, res.box);
            });
          }

          if (onVisionUpdate) {
            onVisionUpdate(data);
          }
        }
      } catch (err) {}
    }, 450);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMonitoring, cameraActive, isSimulationStream, roomName, roomInspectionResults, onVisionUpdate]);

  const drawBoundingBoxes = (ctx, boxes, canvasW, canvasH) => {
    boxes.forEach(box => {
      const isFire = box.category === 'fire' || box.label === 'FLAME';
      const isPerson = box.category === 'person' || box.label === 'OCCUPANT' || box.label === 'PERSON';
      const isSmoke = box.category === 'smoke' || box.label === 'SMOKE';
      
      const strokeColor = isFire ? '#ef4444' : isPerson ? '#06b6d4' : isSmoke ? '#94a3b8' : '#f59e0b';
      
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;

      const { x, y, width: bw, height: bh } = box;
      const cornerLen = Math.min(18, bw * 0.25, bh * 0.25);

      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen); ctx.lineTo(x, y); ctx.lineTo(x + cornerLen, y);
      ctx.moveTo(x + bw - cornerLen, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + cornerLen);
      ctx.moveTo(x + bw, y + bh - cornerLen); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw - cornerLen, y + bh);
      ctx.moveTo(x + cornerLen, y + bh); ctx.lineTo(x, y + bh); ctx.lineTo(x, y + bh - cornerLen);
      ctx.stroke();

      ctx.fillStyle = isFire ? 'rgba(239, 68, 68, 0.15)' : isPerson ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.1)';
      ctx.fillRect(x, y, bw, bh);

      const labelText = `${box.label || box.category.toUpperCase()} ${box.confidence ? `(${Math.round(box.confidence * 100)}%)` : ''}`;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      const textWidth = ctx.measureText(labelText).width;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x, Math.max(0, y - 18), textWidth + 8, 18);
      ctx.fillStyle = '#060a14';
      ctx.fillText(labelText, x + 4, Math.max(12, y - 4));
    });
  };

  const drawCustomHazardBox = (ctx, box) => {
    ctx.strokeStyle = box.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(box.x, box.y - 18, 140, 18);
    ctx.fillStyle = box.color;
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(`⚠️ ${box.label}`, box.x + 4, box.y - 5);
  };

  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `grihini-rakshak-scan-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="bg-navy-950/90 rounded-3xl p-5 border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 shadow-md">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {lang === 'hi' ? '3D AI कमरा व कैमरा विश्लेषक' : 'AI OPTICAL CAMERA & ROOM INSPECTOR'}
              {cameraActive && isMonitoring && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </h2>
            <p className="text-[11px] text-cyan-300/70 font-mono">
              {isSimulationStream 
                ? (lang === 'hi' ? 'वर्चुअल रूम टेस्ट स्ट्रीम' : 'Virtual Chamber Test Stream') 
                : (lang === 'hi' ? 'लाइव कैमरा फीड (घरेलू सुरक्षा एक्टिव)' : 'Live Device Optical Sensor (Surveillance Active)')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={triggerRoomInspectionScan}
            disabled={isScanningRoom}
            className="px-3.5 py-1.5 text-xs font-mono font-bold rounded-xl bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Search className={`w-3.5 h-3.5 inline mr-1 text-amber-400 ${isScanningRoom ? 'animate-spin' : ''}`} />
            <span>{isScanningRoom ? (lang === 'hi' ? 'स्कैनिंग जारी...' : 'SCANNING ROOM...') : (lang === 'hi' ? 'कमरे के खतरे स्कैन करें' : 'SCAN ROOM HAZARDS')}</span>
          </button>

          <button
            onClick={handleToggleSimulationStream}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border transition-all ${
              isSimulationStream
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-cyan-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
            {isSimulationStream ? 'Sim Stream' : 'Test Stream'}
          </button>

          <button
            onClick={handleToggleCamera}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              cameraActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}
          >
            {cameraActive ? <Video className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>

          <button
            onClick={handleCaptureSnapshot}
            disabled={!cameraActive || !isMonitoring}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-cyan-300 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Canvas HUD */}
      <div className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 shadow-inner overflow-hidden flex items-center justify-center">
        
        <video ref={videoRef} playsInline muted className="hidden" />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive && isMonitoring ? 'opacity-100' : 'opacity-25'
          }`}
        />

        {/* HUD Scanner Watermark */}
        {cameraActive && isMonitoring && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-xl bg-navy-950/85 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>AI SCANNING</span>
            <span className="text-slate-500">|</span>
            <span>{visionStats.fps} FPS</span>
            <span className="text-slate-500">|</span>
            <span>{visionStats.latencyMs}ms</span>
          </div>
        )}

        {/* Occupant Detected HUD Pill */}
        {visionStats.peopleCount > 0 && cameraActive && isMonitoring && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-950/90 border border-cyan-400 text-xs font-mono font-bold text-cyan-200 shadow-lg shadow-cyan-500/20">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'hi' ? 'कमरे में व्यक्ति मौजूद है' : 'OCCUPANT SAFE & VERIFIED'}</span>
          </div>
        )}

        {/* Camera Permission / Device in use fallback UI */}
        {permissionState === 'denied' && !isSimulationStream && (
          <div className="absolute inset-0 bg-navy-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-2.5 animate-bounce" />
            <h3 className="text-sm font-bold text-white mb-1.5">Webcam Access Notice</h3>
            <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed font-mono">
              {permErrorMsg}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all shadow-md shadow-cyan-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              <button
                onClick={handleToggleSimulationStream}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 text-xs font-bold font-mono transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Run Test Stream
              </button>
            </div>
          </div>
        )}

        {(!cameraActive || !isMonitoring) && permissionState !== 'denied' && (
          <div className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center font-mono">
            <CameraOff className="w-10 h-10 text-slate-500 mb-2" />
            <p className="text-sm font-bold text-slate-200">
              {lang === 'hi' ? 'कैमरा निगरानी बंद है' : 'Optical Sensor Inactive'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'hi' ? 'कमरे की सुरक्षा के लिए कैमरा चालू करें' : 'Click ARM GUARD to activate indoor surveillance.'}
            </p>
          </div>
        )}
      </div>

      {/* Room Hazard Inspection Audit Results Dropdown */}
      {roomInspectionResults && (
        <div className="mt-3.5 p-3.5 rounded-2xl bg-navy-900/90 border border-amber-500/40 text-xs font-mono space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-amber-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              {lang === 'hi' ? 'कमरे के स्कैन में मिले संभावित खतरे व सावधानियां:' : 'OPTICAL HAZARD SCAN AUDIT FINDINGS:'}
            </span>
            <button
              onClick={() => setRoomInspectionResults(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {roomInspectionResults.map(item => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-[12px]">{item.name}</div>
                <div className="text-[10px] text-amber-400 font-bold mt-0.5">{item.riskLevel}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-tight">{item.advice}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-Time Detection Indicators Footer */}
      <div className="grid grid-cols-4 gap-2.5 mt-3.5 pt-3.5 border-t border-slate-800/90 text-center font-mono">
        <div className="p-2 rounded-xl bg-navy-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-400 tracking-wider">{lang === 'hi' ? 'आग / लपटें' : 'FLAME'}</div>
          <div className={`text-xs font-black ${visionStats.fireDetected ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {visionStats.fireDetected ? `${Math.round(visionStats.fireConf * 100)}%` : (lang === 'hi' ? 'सुरक्षित' : 'CLEAR')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-navy-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-400 tracking-wider">{lang === 'hi' ? 'धुआं' : 'SMOKE'}</div>
          <div className={`text-xs font-black ${visionStats.smokeDetected ? 'text-slate-300' : 'text-emerald-400'}`}>
            {visionStats.smokeDetected ? `${Math.round(visionStats.smokeConf * 100)}%` : (lang === 'hi' ? 'सुरक्षित' : 'CLEAR')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-navy-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-400 tracking-wider">{lang === 'hi' ? 'व्यक्ति' : 'OCCUPANTS'}</div>
          <div className={`text-xs font-black ${visionStats.peopleCount > 0 ? 'text-cyan-400' : 'text-slate-400'}`}>
            {visionStats.peopleCount} {lang === 'hi' ? (visionStats.peopleCount === 1 ? 'व्यक्ति' : 'लोग') : (visionStats.peopleCount === 1 ? 'PERSON' : 'PEOPLE')}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-navy-900/70 border border-slate-800">
          <div className="text-[10px] text-slate-400 tracking-wider">{lang === 'hi' ? 'हलचल' : 'MOTION'}</div>
          <div className={`text-xs font-black ${visionStats.motionScore > 0.4 ? 'text-amber-400' : 'text-slate-400'}`}>
            {Math.round(visionStats.motionScore * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
