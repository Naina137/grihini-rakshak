import React, { useState, useEffect } from 'react';
import { Radio, Users, Plus, Trash2, Shield, Lock, Bell, Check, MapPin, EyeOff } from 'lucide-react';
import { fetchContacts, saveContact } from '../services/api';

export default function SettingsTab({ roomName, setRoomName }) {
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: 'Family / Roommate',
    email: '',
    auto_alert: true
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await fetchContacts();
      if (data && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.warn('Failed to load contacts:', e);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;

    try {
      await saveContact(newContact);
      setNewContact({
        name: '',
        phone: '',
        relationship: 'Family / Roommate',
        email: '',
        auto_alert: true
      });
      setShowAddForm(false);
      loadContacts();
    } catch (err) {
      console.warn('Add contact error:', err);
    }
  };

  const handleSaveRoomName = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      
      {/* Room Identification Section */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            ROOM IDENTIFICATION & ZONE CONFIGURATION
          </h2>
        </div>

        <form onSubmit={handleSaveRoomName} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">
              PRIMARY MONITORED LOCATION NAME
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Living Room - Unit 4B"
              className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'SAVED!' : 'UPDATE ZONE'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Contacts Section */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                EMERGENCY CONTACTS & AUTOMATIC DISPATCH
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Designated parties notified automatically when risk reaches CRITICAL
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold hover:bg-cyan-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'CANCEL' : 'ADD CONTACT'}</span>
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddForm && (
          <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-navy-950 border border-cyan-500/30 mb-4 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Name / Agency</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concierge / Dispatch"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +1 (555) 019-2834"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Relationship / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Building Security"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. dispatch@security.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={newContact.auto_alert}
                  onChange={(e) => setNewContact({ ...newContact, auto_alert: e.target.checked })}
                  className="accent-cyan-400"
                />
                <span>Auto-dispatch alert immediately on CRITICAL level</span>
              </label>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        {/* Existing Contacts List */}
        <div className="divide-y divide-slate-800">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="py-3 flex items-center justify-between gap-3 font-mono text-xs"
            >
              <div>
                <div className="font-bold text-slate-200">{c.name}</div>
                <div className="text-[11px] text-slate-400">
                  {c.relationship} • {c.phone} {c.email ? `• ${c.email}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {c.auto_alert && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    AUTO-NOTIFY
                  </span>
                )}
                <span className="text-[10px] text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy, Cryptography & Ephemeral Guarantees */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            PRIVACY & ZERO-RETENTION ARCHITECTURE
          </h2>
        </div>

        <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <EyeOff className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Ephemeral In-Memory Frame Buffer:</strong> Video frames and acoustic signals are analyzed entirely in volatile memory and discarded immediately following feature extraction. No raw recordings are written to disk.
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Explicit Hardware Consent:</strong> Web camera and microphone permissions are requested explicitly by browser dialogue. Monitoring immediately halts upon pressing 'STOP GUARD'.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
