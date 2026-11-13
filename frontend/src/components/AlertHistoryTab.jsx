import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, CheckCircle2, AlertTriangle, Clock, MapPin, RefreshCw, Check } from 'lucide-react';
import { fetchAlerts, acknowledgeAlert } from '../services/api';

export default function AlertHistoryTab() {
  const [alerts, setAlerts] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAlerts(60);
      if (data && data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (e) {
      console.warn('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, 'Acknowledged via Alert History table');
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true, status: 'ACKNOWLEDGED' } : a));
    } catch (e) {
      console.warn('Ack error:', e);
    }
  };

  const filtered = alerts.filter(a => {
    const matchesLevel = filterLevel === 'ALL' || a.risk_level === filterLevel;
    const matchesSearch = 
      (a.room_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.hazards || []).some(h => h.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'HIGH RISK':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search room, hazard, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            {['ALL', 'CRITICAL', 'HIGH RISK', 'WARNING'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterLevel === lvl
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={loadAlerts}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-cyan-300"
            title="Refresh Alert Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts Table / Cards */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-slate-200">No Alerts Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Your monitored spaces have reported zero unacknowledged anomalies for this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map(alert => (
              <div
                key={alert.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1.5 font-mono">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSeverityBadge(alert.risk_level)}`}>
                      {alert.risk_level}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {alert.room_name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                    {alert.is_simulated && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                        SIMULATED
                      </span>
                    )}
                  </div>

                  {/* Hazards */}
                  <div className="text-xs font-semibold text-slate-200">
                    {(alert.hazards || []).join(' • ')}
                  </div>

                  {alert.notes && (
                    <div className="text-[11px] text-slate-400">
                      Protocol: {alert.notes}
                    </div>
                  )}
                </div>

                {/* Status & Ack */}
                <div className="flex items-center gap-3 shrink-0">
                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                      ACKNOWLEDGED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-3 py-1.5 rounded-xl shadow-md transition-all"
                    >
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
