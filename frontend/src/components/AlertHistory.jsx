import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Search, 
  Clock, 
  MapPin, 
  RefreshCw,
  ShieldAlert,
  Flame,
  Volume2,
  Wind
} from 'lucide-react';
import { API_BASE } from '../utils/constants';

export default function AlertHistory({ onRefreshStats }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/alerts?limit=100`;
      if (filterSeverity !== 'ALL') {
        url += `&risk_level=${filterSeverity}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.error("Fetch alerts failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filterSeverity]);

  const handleAcknowledge = async (id) => {
    try {
      await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: "Security Operator" })
      });
      fetchAlerts();
    } catch (e) {
      console.error("Acknowledge failed:", e);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await fetch(`${API_BASE}/alerts/acknowledge-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: "Security Operator" })
      });
      fetchAlerts();
    } catch (e) {
      console.error("Acknowledge all failed:", e);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear all historical incident records?")) {
      try {
        await fetch(`${API_BASE}/alerts/clear`, { method: 'DELETE' });
        fetchAlerts();
      } catch (e) {
        console.error("Clear failed:", e);
      }
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.hazard_type && a.hazard_type.toLowerCase().includes(term)) ||
      (a.room_name && a.room_name.toLowerCase().includes(term)) ||
      (a.summary && a.summary.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alert Incident Log & Historical Registry
          </h2>
          <p className="text-xs text-slate-400">
            Audit trail of verified safety incidents, multi-modal convergence, and operator response logs.
          </p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAcknowledgeAll}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
          >
            Acknowledge All
          </button>
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by hazard, room name, or incident keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CRITICAL', 'HIGH RISK', 'WARNING'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filterSeverity === sev
                  ? 'bg-cyan-500 text-slate-950 glow-cyan'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Table / Cards */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-200">Incident Registry Clear</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No hazard events registered under the selected filters. Sentinel AI is actively guarding your room.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredAlerts.map((alert) => {
              const isCrit = alert.risk_level === 'CRITICAL';
              const isHigh = alert.risk_level === 'HIGH RISK';
              const timeStr = new Date(alert.timestamp).toLocaleString();

              return (
                <div 
                  key={alert.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-900/40 ${
                    !alert.acknowledged ? 'bg-slate-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Severity Badge Icon */}
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/40 glow-red' :
                      isHigh ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isCrit ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                          isHigh ? 'bg-orange-500/30 text-orange-300 border border-orange-500/50' :
                          'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        }`}>
                          {alert.risk_level}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">
                          {alert.hazard_type}
                        </h4>
                        <span className="text-[11px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800">
                          {Math.round((alert.combined_score || 0.8) * 100)}% CONF
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {alert.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {alert.room_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side Acknowledge button or Status */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {alert.acknowledged ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow glow-cyan cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
