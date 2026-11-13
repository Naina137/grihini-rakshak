import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Thermometer, 
  FlaskConical, 
  PhoneCall, 
  Settings, 
  ShieldCheck, 
  Eye
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, alertCounts, isMonitoring }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Guardian Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'alerts',
      label: 'Alert Log & History',
      icon: AlertTriangle,
      badge: alertCounts?.unacknowledged_count > 0 ? alertCounts.unacknowledged_count : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'sensors',
      label: 'Environmental Telemetry',
      icon: Thermometer,
      sublabel: 'SIMULATED'
    },
    {
      id: 'testing',
      label: 'Diagnostic Test Center',
      icon: FlaskConical,
      sublabel: '8 Drills'
    },
    {
      id: 'contacts',
      label: 'Emergency Contacts',
      icon: PhoneCall,
      badge: null
    },
    {
      id: 'settings',
      label: 'Safety Thresholds & Privacy',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 border-r border-cyan-500/10 bg-[#070B14]/95 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* Monitoring State Header */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Guardian Engine</span>
            <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-cyan-400 glow-cyan animate-pulse' : 'bg-slate-600'}`} />
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${isMonitoring ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-200">
              {isMonitoring ? 'Autonomous Guardian' : 'Surveillance Paused'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {isMonitoring ? 'Local AI inference active' : 'Turn on surveillance to start'}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-cyan-300 border border-cyan-500/30 glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <span>{item.label}</span>
                    {item.sublabel && (
                      <span className="block text-[9px] font-mono text-cyan-400/80 uppercase">
                        {item.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Privacy Guarantee Pill */}
      <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Eye className="w-3.5 h-3.5" />
          <span>Zero-Leak Privacy</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Video and audio processing executed in ephemeral memory. No persistent audio/video files stored.
        </p>
      </div>
    </aside>
  );
}
