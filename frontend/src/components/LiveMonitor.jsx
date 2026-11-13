import React, { useRef, useEffect } from 'react';
import { Camera, CameraOff, Video, Flame, Wind, User, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export default function LiveMonitor({
  videoRef,
  isCameraActive,
  hasPermission,
  errorMessage,
  fps,
  onToggleCamera,
  visualDetections
}) {
  const overlayCanvasRef = useRef(null);

  // Draw real-time bounding boxes on top of video feed
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isCameraActive) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!visualDetections) return;

    // 1. Draw Fire Flames (Red-Orange with glow)
    if (visualDetections.fire_regions && visualDetections.fire_regions.length > 0) {
      visualDetections.fire_regions.forEach((box) => {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 12;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.fillRect(box.x, Math.max(0, box.y - 24), ctx.measureText(box.label).width + 16, 22);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(box.label, box.x + 8, Math.max(16, box.y - 8));
        ctx.shadowBlur = 0;
      });
    }

    // 2. Draw Smoke Regions (Slate-Blue dashed)
    if (visualDetections.smoke_regions && visualDetections.smoke_regions.length > 0) {
      visualDetections.smoke_regions.forEach((box) => {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.fillRect(box.x, Math.max(0, box.y - 22), ctx.measureText(box.label).width + 16, 20);

        ctx.fillStyle = '#0B0F19';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(box.label, box.x + 8, Math.max(14, box.y - 7));
      });
    }

    // 3. Draw People (Cyan)
    if (visualDetections.people_regions && visualDetections.people_regions.length > 0) {
      visualDetections.people_regions.forEach((box) => {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.fillRect(box.x, Math.max(0, box.y - 22), ctx.measureText(box.label).width + 16, 20);

        ctx.fillStyle = '#070B14';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(box.label, box.x + 8, Math.max(14, box.y - 7));
      });
    }
  }, [visualDetections, isCameraActive, videoRef]);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Optical Surveillance Feed
              {isCameraActive && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  LIVE {fps} FPS
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">Real-time flame, smoke, person, and motion analytics</p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isCameraActive
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 glow-cyan'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              <span>Disable Cam</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Cam</span>
            </>
          )}
        </button>
      </div>

      {/* Main Video Screen Container */}
      <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
        {/* Actual Video Tag */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* AI Detection Bounding Boxes Overlay */}
        <canvas
          ref={overlayCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Crosshair Target Reticle overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
          </div>
        )}

        {/* Standby / Permission Refusal Screen */}
        {!isCameraActive && (
          <div className="text-center p-6 space-y-3 max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              {errorMessage ? <AlertCircle className="w-7 h-7 text-amber-400" /> : <CameraOff className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {errorMessage ? "Camera Permission Required" : "Optical Feed Standby"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {errorMessage || "Click 'Enable Cam' to grant camera access and activate continuous visual safety guarding."}
              </p>
            </div>
            <button
              onClick={onToggleCamera}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{errorMessage ? "Retry Permission" : "Start Camera Feed"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Visual Telemetry Status Footer */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Flame status */}
        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          visualDetections?.has_fire 
            ? 'bg-red-500/20 border-red-500/50 text-red-400 glow-red animate-pulse'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <Flame className="w-4 h-4 shrink-0 text-red-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Flame</div>
            <div className="font-bold text-slate-200">
              {visualDetections?.has_fire ? `${Math.round((visualDetections.fire_confidence || 0) * 100)}% DETECTED` : 'None'}
            </div>
          </div>
        </div>

        {/* Smoke status */}
        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          visualDetections?.has_smoke
            ? 'bg-sky-500/20 border-sky-500/50 text-sky-400 glow-cyan animate-pulse'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <Wind className="w-4 h-4 shrink-0 text-sky-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Smoke</div>
            <div className="font-bold text-slate-200">
              {visualDetections?.has_smoke ? `${Math.round((visualDetections.smoke_confidence || 0) * 100)}% DETECTED` : 'Clear'}
            </div>
          </div>
        </div>

        {/* Person count */}
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center gap-2">
          <User className="w-4 h-4 shrink-0 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Occupancy</div>
            <div className="font-bold text-slate-200">
              {visualDetections?.people_count || 0} {visualDetections?.people_count === 1 ? 'Person' : 'People'}
            </div>
          </div>
        </div>

        {/* Movement status */}
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 shrink-0 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Motion</div>
            <div className="font-bold text-slate-200 truncate">
              {visualDetections?.has_unusual_motion ? 'UNUSUAL MOTION' : (visualDetections?.motion_description || 'Stable')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
