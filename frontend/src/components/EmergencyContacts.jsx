import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  UserPlus, 
  Trash2, 
  Send, 
  ShieldAlert, 
  Mail, 
  CheckCircle2, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { API_BASE } from '../utils/constants';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newRel, setNewRel] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [notifyWarning, setNotifyWarning] = useState(false);
  const [notifyCritical, setNotifyCritical] = useState(true);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/contacts`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch contacts failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    try {
      await fetch(`${API_BASE}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          relationship: newRel || 'Guardian Contact',
          phone_number: newPhone,
          email: newEmail,
          notify_on_warning: notifyWarning,
          notify_on_critical: notifyCritical
        })
      });

      setNewName('');
      setNewRel('');
      setNewPhone('');
      setNewEmail('');
      setShowAddModal(false);
      fetchContacts();
    } catch (err) {
      console.error("Create contact error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this emergency contact?")) {
      try {
        await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
        fetchContacts();
      } catch (err) {
        console.error("Delete contact error:", err);
      }
    }
  };

  const handleTestDispatch = async (id) => {
    try {
      setDispatchResult({ loading: true, id });
      const res = await fetch(`${API_BASE}/contacts/${id}/test-alert`, { method: 'POST' });
      const data = await res.json();
      setDispatchResult({
        id,
        success: true,
        message: `Dispatched to ${data.recipient} (${data.phone}) via ${data.delivery_method}`
      });
      setTimeout(() => setDispatchResult(null), 5000);
    } catch (e) {
      setDispatchResult({ id, success: false, message: "Dispatch failed" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-cyan-400" />
            Emergency Contacts & First Responder Roster
          </h2>
          <p className="text-xs text-slate-400">
            Automated notification dispatch for critical life safety alerts and room security escalations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 glow-cyan transition shadow cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Emergency Contact</span>
        </button>
      </div>

      {/* Dispatch feedback toast */}
      {dispatchResult && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          dispatchResult.success ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {dispatchResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{dispatchResult.message}</span>
        </div>
      )}

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {contacts.map((c) => (
          <div
            key={c.id}
            className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-cyan-500/30 transition relative group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                  <Phone className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
              <p className="text-xs text-cyan-400 font-medium">{c.relationship}</p>

              <div className="space-y-1.5 mt-3 text-xs text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.phone_number}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
              </div>

              {/* Notification Tiers */}
              <div className="flex items-center gap-2 mt-4 text-[10px] font-mono">
                {c.notify_on_critical && (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                    CRITICAL ALERTS
                  </span>
                )}
                {c.notify_on_warning && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    WARNINGS
                  </span>
                )}
              </div>
            </div>

            {/* Test Alert Dispatch Button */}
            <div className="pt-3 mt-3 border-t border-slate-800/80">
              <button
                onClick={() => handleTestDispatch(c.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Emergency Alert</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-cyan-500/30 glow-cyan">
            <h3 className="text-base font-bold text-slate-100 mb-1">Add Emergency Contact</h3>
            <p className="text-xs text-slate-400 mb-4">First responder or family member to notify in safety events.</p>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name or Agency *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Municipal Fire Dispatch / John Doe"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Relationship / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Security / First Responder / Owner"
                  value={newRel}
                  onChange={e => setNewRel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Emergency Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="alerts@dispatch.org"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifyCritical}
                    onChange={e => setNotifyCritical(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
                  />
                  <span>Dispatch on CRITICAL life safety emergencies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={notifyWarning}
                    onChange={e => setNotifyWarning(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0"
                  />
                  <span>Dispatch on WARNING anomalies</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
