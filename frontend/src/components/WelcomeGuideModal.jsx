import React from 'react';
import { Shield, Sparkles, Flame, Zap, Wind, Mic, X, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function WelcomeGuideModal({ lang = 'en', isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0d1527] via-[#080d1a] to-[#040711] rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-400/50 shadow-lg shadow-cyan-500/30">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'hi' ? 'घरेलू आपदा रक्षक प्रणाली' : 'SMART INDOOR DISASTER DEFENSE'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {lang === 'hi' ? 'नमस्ते! गृहिणी रक्षक (Grihini Rakshak) में आपका स्वागत है' : 'Welcome to GRIHINI RAKSHAK (गृहिणी रक्षक)'}
            </h2>
          </div>
        </div>

        {/* Intro Prose */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans mb-5">
          {lang === 'hi'
            ? 'यह AI रक्षक आपके घर, परिवार और ज़रूरी सामान को आग, गैस रिसाव, शॉर्ट-सर्किट, सीलिंग फैन गिरने और किसी भी घरेलू अनहोनी से बचाने के लिए निरंतर निगरानी करता है। नीचे जानिए यह आपकी सुरक्षा कैसे करता है:'
            : 'Grihini Rakshak is an intelligent software-only home guardian engineered to safeguard your family and household assets from domestic disasters. Here is how it protects your home:'}
        </p>

        {/* 4 Core Protection Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 font-mono text-xs">
          
          <div className="p-3.5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-950/80 text-red-400 border border-red-500/40 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-[13px]">
                {lang === 'hi' ? 'रसोई व गैस सुरक्षा' : 'Kitchen & Gas Fire Shield'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mt-1">
                {lang === 'hi' 
                  ? 'गैस लीक, स्टोव की लपटें व तेल में अचानक लगी आग को तुरंत भांपकर चेतावनी देना।' 
                  : 'Detects unlit combustible gas leaks, oil flare-ups, and smoldering kitchen fires.'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/40 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-[13px]">
                {lang === 'hi' ? 'इलेक्ट्रिकल शॉर्ट-सर्किट' : 'Electrical Short Circuit'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mt-1">
                {lang === 'hi'
                  ? 'ओवरलोडेड सॉकेट्स, तार गर्म होना व स्पार्किंग से होने वाली आग से बचाव।'
                  : 'Monitors overloaded power strips, loose wiring sparks, and heat buildup.'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-500/40 shrink-0">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-[13px]">
                {lang === 'hi' ? 'सीलिंग फैन व घरेलू दुर्घटना' : 'Ceiling Fan & Structural Risk'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mt-1">
                {lang === 'hi'
                  ? 'पंखे के हिलने, कांच टूटने या भारी सामान गिरने का तुरंत पता लगाना।'
                  : 'Identifies wobbling ceiling fans, glass fractures, and sudden structural drops.'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-navy-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/40 shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-[13px]">
                {lang === 'hi' ? 'आवाज़ व संकट पहचान (SOS)' : 'Voice & Distress SOS'}
              </div>
              <div className="text-[11px] text-slate-400 leading-tight mt-1">
                {lang === 'hi'
                  ? 'आपकी आवाज़ सुनकर तनाव, डर या मदद की पुकार ("बचाओ", "Help") को पहचानना।'
                  : 'Understands your voice stress, emotional distress, and emergency cries for help.'}
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm font-mono flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{lang === 'hi' ? 'सुरक्षा डैशबोर्ड शुरू करें (START GUARDIAN)' : 'ENTER GRIHINI RAKSHAK DASHBOARD'}</span>
        </button>
      </div>
    </div>
  );
}
