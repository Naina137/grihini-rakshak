import React, { useRef, useEffect, useState } from 'react';
import { Box, Shield, Zap, Wind, Flame, Eye, User, Sparkles, AlertTriangle } from 'lucide-react';

export default function HolographicRoom3D({ lang = 'en', selectedHazard, onSelectHazard }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [rotationY, setRotationY] = useState(0.4);
  const [rotationX, setRotationX] = useState(0.35);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // 3D Objects in the room
  const roomNodes = [
    {
      id: 'electrical',
      name: lang === 'hi' ? 'इलेक्ट्रिकल सॉकेट व ओवरलोडेड वायरिंग' : 'Electrical Switchboard & Sockets',
      category: 'Short Circuit / Fire Hazard',
      dangerScore: 78,
      riskLevel: 'HIGH',
      pos: [-120, -20, -140], // 3D coordinates (x, y, z)
      color: '#ef4444',
      icon: Zap,
      description: lang === 'hi' 
        ? 'ओवरहीटिंग या शॉर्ट सर्किट का खतरा। स्पार्क होने पर आग भड़क सकती है।' 
        : 'Overheating & short-circuit risk. Potential spark source near wall.'
    },
    {
      id: 'fan',
      name: lang === 'hi' ? 'सीलिंग फैन (कंपन व गिरने का खतरा)' : 'Ceiling Fan (Structural / Fall Risk)',
      category: 'Mechanical Hazard',
      dangerScore: 42,
      riskLevel: 'MODERATE',
      pos: [0, -110, 0],
      color: '#f59e0b',
      icon: Wind,
      description: lang === 'hi'
        ? 'कंपन या ढीले नट-बोल्ट से नीचे गिरने का खतरा। नियमित जांच अनुशंसित।'
        : 'Loose fasteners or wobble imbalance could lead to mechanical detachment.'
    },
    {
      id: 'flammables',
      name: lang === 'hi' ? 'पटाखे व ज्वलनशील सामग्री' : 'Combustibles & Flammables Storage',
      category: 'Explosive / Flammable',
      dangerScore: 89,
      riskLevel: 'CRITICAL',
      pos: [110, 40, -100],
      color: '#dc2626',
      icon: Flame,
      description: lang === 'hi'
        ? 'कमरे में रखे पटाखे, अल्कोहल स्प्रे या गैस कैन। छोटी सी चिंगारी से विस्फोट संभव।'
        : 'Firecrackers, solvents, or aerosols. Severe flashover and explosion risk.'
    },
    {
      id: 'window',
      name: lang === 'hi' ? 'खिड़की व कांच (सेंधमारी / टूटने का खतरा)' : 'Exterior Window & Glass Pane',
      category: 'Intrusion / Shatter',
      dangerScore: 54,
      riskLevel: 'MODERATE',
      pos: [-140, 0, 40],
      color: '#06b6d4',
      icon: Shield,
      description: lang === 'hi'
        ? 'कांच टूटने या बाहर से जबरन प्रवेश (Intrusion) का खतरा।'
        : 'Glass shatter vulnerability and external unauthorized access point.'
    },
    {
      id: 'occupant',
      name: lang === 'hi' ? 'कमरे में मौजूद व्यक्ति (Occupant)' : 'Primary Occupant Location',
      category: 'Human Presence',
      dangerScore: 12,
      riskLevel: 'SAFE',
      pos: [20, 25, 30],
      color: '#10b981',
      icon: User,
      description: lang === 'hi'
        ? 'व्यक्ति सुरक्षित है। किसी आक्रामक व्यवहार या खतरे का संकेत नहीं है।'
        : 'Resident verified. Normal posture and peaceful non-hostile status.'
    }
  ];

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setRotationY(prev => prev + dx * 0.008);
    setRotationX(prev => Math.max(0.1, Math.min(0.7, prev - dy * 0.008)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let tick = 0;

    const project = (x, y, z, cx, cy, fov = 320) => {
      // Rotate Y
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;

      // Rotate X
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX + 380; // Distance

      const scale = fov / (z2 || 1);
      return {
        x: cx + x1 * scale,
        y: cy + y2 * scale,
        z: z2,
        scale
      };
    };

    const render = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2 + 15;

      // Deep OLED Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle background ambient grid
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const gridSize = 160;
      const gridSteps = 6;
      const step = (gridSize * 2) / gridSteps;

      // Floor wireframe grid
      ctx.beginPath();
      for (let i = -gridSize; i <= gridSize; i += step) {
        const p1 = project(i, 60, -gridSize, cx, cy);
        const p2 = project(i, 60, gridSize, cx, cy);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        const p3 = project(-gridSize, 60, i, cx, cy);
        const p4 = project(gridSize, 60, i, cx, cy);
        ctx.moveTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
      }
      ctx.stroke();

      // Ceiling wireframe grid
      ctx.strokeStyle = '#0b1329';
      ctx.beginPath();
      for (let i = -gridSize; i <= gridSize; i += step * 2) {
        const p1 = project(i, -120, -gridSize, cx, cy);
        const p2 = project(i, -120, gridSize, cx, cy);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();

      // Room Corner Pillars (Vertical room wireframe)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      const corners = [
        [-gridSize, -gridSize],
        [gridSize, -gridSize],
        [gridSize, gridSize],
        [-gridSize, gridSize]
      ];
      ctx.beginPath();
      corners.forEach(([kx, kz]) => {
        const top = project(kx, -120, kz, cx, cy);
        const bot = project(kx, 60, kz, cx, cy);
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bot.x, bot.y);
      });
      ctx.stroke();

      // Holographic Sweeping Laser Radar Ring
      const radarSweep = (tick * 0.035) % (Math.PI * 2);
      ctx.save();
      const laserCenter = project(0, 58, 0, cx, cy);
      const laserRadius = 140 * (laserCenter.scale / 1.1);
      
      const grad = ctx.createRadialGradient(laserCenter.x, laserCenter.y, 5, laserCenter.x, laserCenter.y, laserRadius);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      grad.addColorStop(0.8, 'rgba(6, 182, 212, 0.05)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(laserCenter.x, laserCenter.y, laserRadius, radarSweep, radarSweep + 1.2);
      ctx.lineTo(laserCenter.x, laserCenter.y);
      ctx.fill();
      ctx.restore();

      // Sort nodes by depth z for accurate rendering
      const projectedNodes = roomNodes.map(node => {
        const p = project(node.pos[0], node.pos[1], node.pos[2], cx, cy);
        return { ...node, ...p };
      }).sort((a, b) => b.z - a.z);

      // Render 3D Object Nodes
      projectedNodes.forEach(node => {
        const isHovered = selectedHazard?.id === node.id;
        const pulse = Math.sin(tick * 0.08 + node.dangerScore) * 3;
        const r = Math.max(6, 9 * (node.scale / 0.8) + (isHovered ? 4 : pulse));

        // Pulsing radar glow
        ctx.save();
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered ? 25 : 12;

        // Ground anchor line
        const ground = project(node.pos[0], 60, node.pos[2], cx, cy);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(ground.x, ground.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node circle
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Outer beacon ring
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // 3D Tag Label
        ctx.font = `${isHovered ? 'bold 11px' : '10px'} JetBrains Mono, monospace`;
        const text = `${node.name.slice(0, 16)}.. [${node.dangerScore}%]`;
        const tw = ctx.measureText(text).width;

        ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
        ctx.fillRect(node.x - tw / 2 - 4, node.y - r - 18, tw + 8, 16);
        ctx.strokeStyle = isHovered ? node.color : '#334155';
        ctx.strokeRect(node.x - tw / 2 - 4, node.y - r - 18, tw + 8, 16);

        ctx.fillStyle = isHovered ? '#ffffff' : node.color;
        ctx.fillText(text, node.x - tw / 2, node.y - r - 6);
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [rotationX, rotationY, selectedHazard, lang]);

  return (
    <div className="bg-navy-950/90 rounded-3xl p-5 border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/20 animate-pulse">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {lang === 'hi' ? '3D कमरा व खतरनाक वस्तु स्कैनर' : '3D ROOM & HAZARD SCANNER'}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700">
                LIDAR V2.0
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {lang === 'hi' 
                ? 'कमरे को ड्रैग करके घुमाएं • खतरे वाले पॉइंट पर क्लिक करें' 
                : 'Drag to rotate 3D wireframe • Click hazardous nodes to inspect'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-navy-900 px-3 py-1 rounded-xl border border-cyan-500/30">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'hi' ? '3D रडार लाइव' : '3D MESH ACTIVE'}</span>
        </div>
      </div>

      {/* 3D Wireframe Canvas Viewport */}
      <div 
        className="relative w-full h-72 sm:h-80 rounded-2xl bg-black border border-slate-800 shadow-inner overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={320}
          className="w-full h-full object-cover"
        />

        {/* HUD Controls Helper */}
        <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-400 bg-navy-950/80 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-md">
          <span>🔄 {lang === 'hi' ? 'घुमाने के लिए ड्रैग करें' : 'Drag with mouse to rotate perspective'}</span>
        </div>
      </div>

      {/* Interactive Room Hazard Selector List */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 uppercase mb-2 flex items-center justify-between">
          <span>{lang === 'hi' ? 'कमरे में खोजी गई संभावित खतरनाक वस्तुएं' : 'DETECTED ROOM OBJECTS & HAZARD AUDIT'}</span>
          <span className="text-cyan-400 font-semibold">{roomNodes.length} NODES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {roomNodes.map(node => {
            const Icon = node.icon;
            const isSelected = selectedHazard?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => onSelectHazard(node)}
                className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-navy-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  className="p-1.5 rounded-lg shrink-0 mt-0.5"
                  style={{ backgroundColor: `${node.color}20`, color: node.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{node.name}</span>
                    <span 
                      className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${node.color}25`, color: node.color }}
                    >
                      {node.dangerScore}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 font-mono mt-0.5">
                    {node.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
