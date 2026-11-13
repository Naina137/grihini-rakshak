import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Flame, Zap, Wind, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function RoomHazardAnalysisCard({ lang = 'en' }) {
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(6); // Today (index 6)

  // Comparative Risk Matrix
  const comparativeItems = [
    {
      id: 'crackers',
      name: lang === 'hi' ? 'पटाखे व ज्वलनशील केमिकल (Combustibles)' : 'Firecrackers & Stored Flammables',
      danger: 89,
      level: lang === 'hi' ? 'अत्यधिक खतरनाक' : 'CRITICAL',
      color: 'bg-red-500 text-red-300 border-red-500/40',
      barColor: 'bg-gradient-to-r from-red-600 to-red-400',
      details: lang === 'hi' 
        ? 'कमरे में ज्वलनशील सामग्री या पटाखों का संचय। चिंगारी या हीट से तुरंत विस्फोट का खतरा।'
        : 'Storage of pyrotechnics or solvents. Extreme flashover explosion risk.'
    },
    {
      id: 'electrical',
      name: lang === 'hi' ? 'इलेक्ट्रिकल शॉर्ट सर्किट व मल्टी-प्लग' : 'Electrical Short Circuit & Overload',
      danger: 78,
      level: lang === 'hi' ? 'गंभीर' : 'HIGH',
      color: 'bg-orange-500 text-orange-300 border-orange-500/40',
      barColor: 'bg-gradient-to-r from-orange-600 to-amber-400',
      details: lang === 'hi'
        ? 'सॉकेट में अधिक लोड व पुरानी वायरिंग। स्पार्क होने पर आग पकड़ने की संभावना।'
        : 'Overloaded socket strips and aged insulation. Major source of electrical fires.'
    },
    {
      id: 'window',
      name: lang === 'hi' ? 'कांच की खिड़की व बालकनी ग्रिल' : 'Glass Window & Perimeter Vulnerability',
      danger: 54,
      level: lang === 'hi' ? 'मध्यम' : 'MODERATE',
      color: 'bg-cyan-500 text-cyan-300 border-cyan-500/40',
      barColor: 'bg-gradient-to-r from-cyan-600 to-blue-400',
      details: lang === 'hi'
        ? 'कांच टूटने से चोट या बाहरी व्यक्ति द्वारा जबरन घुसपैठ (Break-in) का खतरा।'
        : 'Risk of glass shattering and unauthorized external intrusion.'
    },
    {
      id: 'fan',
      name: lang === 'hi' ? 'सीलिंग फैन (कंपन व गिरने का खतरा)' : 'Ceiling Fan Mechanical Detachment',
      danger: 42,
      level: lang === 'hi' ? 'सामान्य चेतावनी' : 'WARNING',
      color: 'bg-amber-500 text-amber-300 border-amber-500/40',
      barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      details: lang === 'hi'
        ? 'हाई स्पीड पर पंखे का हिलना या स्क्रू ढीला होना। नीचे गिरने से गंभीर चोट संभव।'
        : 'Bearing wobble or loose fastener imbalance creating structural drop risk.'
    },
    {
      id: 'intent',
      name: lang === 'hi' ? 'व्यक्तिगत आक्रामकता / अनैतिक इरादा' : 'Hostile Intent / Aggressive Agitation',
      danger: 18,
      level: lang === 'hi' ? 'सुरक्षित (सामान्य)' : 'SAFE',
      color: 'bg-emerald-500 text-emerald-300 border-emerald-500/40',
      barColor: 'bg-gradient-to-r from-emerald-600 to-teal-400',
      details: lang === 'hi'
        ? 'AI मूवमेंट व वॉयस ट्रैकिंग: कमरे में मौजूद व्यक्ति शांत व सुरक्षित है। कोई हिंसक गतिविधि नहीं।'
        : 'Acoustic & motion tracking confirms resident is peaceful with zero hostile movement.'
    }
  ];

  // 7-Day Historical Daily Safety Trend Data
  const dailyHistory = [
    { day: lang === 'hi' ? 'सोम' : 'Mon', date: 'Nov 08', safetyScore: 98, incidents: 0, status: 'OPTIMAL' },
    { day: lang === 'hi' ? 'मंगल' : 'Tue', date: 'Nov 09', safetyScore: 94, incidents: 0, status: 'OPTIMAL' },
    { day: lang === 'hi' ? 'बुध' : 'Wed', date: 'Nov 10', safetyScore: 88, incidents: 1, status: 'SPARK AVERTED' },
    { day: lang === 'hi' ? 'गुरु' : 'Thu', date: 'Nov 11', safetyScore: 96, incidents: 0, status: 'OPTIMAL' },
    { day: lang === 'hi' ? 'शुक्र' : 'Fri', date: 'Nov 12', safetyScore: 91, incidents: 0, status: 'OPTIMAL' },
    { day: lang === 'hi' ? 'शनि' : 'Sat', date: 'Nov 13', safetyScore: 95, incidents: 0, status: 'OPTIMAL' },
    { day: lang === 'hi' ? 'आज' : 'Today', date: 'Nov 14', safetyScore: 97, incidents: 0, status: 'GUARD ACTIVE' },
  ];

  return (
    <div className="bg-navy-950/90 rounded-3xl p-5 border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              {lang === 'hi' ? 'कमरे के खतरों का तुलनात्मक विश्लेषण' : 'ROOM HAZARDS & COMPARATIVE AUDIT'}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700">
                AUDIT MATRIX
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              {lang === 'hi' 
                ? 'कमरे में मौजूद वस्तुओं की खतरनाक रैंकिंग व 7-दिवसीय सुरक्षा ग्राफ'
                : 'Comparative vulnerability ranking & 7-day indoor safety trends'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/40">
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'hi' ? 'सुरक्षा इंडेक्स: 97% सुरक्षित' : 'SAFETY INDEX: 97% SECURE'}</span>
        </div>
      </div>

      {/* 1. Comparative Hazard Severity Ranking Bars */}
      <div className="space-y-3 mb-5">
        <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
          <span>{lang === 'hi' ? 'वस्तु व जोखिम तुलना (कौन सी वस्तु ज्यादा खतरनाक है)' : 'HAZARD SEVERITY BREAKDOWN (COMPARATIVE RISK)'}</span>
          <span className="text-slate-500">SORTED BY DANGER LEVEL</span>
        </div>

        <div className="space-y-2.5">
          {comparativeItems.map(item => (
            <div 
              key={item.id}
              className="p-3 rounded-2xl bg-navy-900/70 border border-slate-800 hover:border-slate-700 transition-all font-mono"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{item.name}</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${item.color}`}>
                    {item.level}
                  </span>
                </div>
                <span className="font-black text-cyan-300">{item.danger}%</span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mb-1.5">
                <div 
                  className={`h-full ${item.barColor} transition-all duration-700`}
                  style={{ width: `${item.danger}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400 line-clamp-1">
                {item.details}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 7-Day Safety Trend Graph (Data Visualization) */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 uppercase mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            {lang === 'hi' ? '7-दिवसीय सुरक्षा ग्राफ (दैनिक तुलना)' : '7-DAY DAILY SAFETY TELEMETRY TREND'}
          </span>
          <span className="text-cyan-400 font-bold">{dailyHistory[selectedTimelineDay].date}</span>
        </div>

        {/* Interactive SVG Trend Chart */}
        <div className="relative h-32 w-full rounded-2xl bg-black/60 border border-slate-800 p-3 flex flex-col justify-between">
          
          {/* SVG Trend Line */}
          <div className="relative h-20 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area fill */}
              <path
                d="M 50 10 L 150 25 L 250 50 L 350 18 L 450 35 L 550 20 L 650 12 L 650 80 L 50 80 Z"
                fill="url(#trendGradient)"
              />

              {/* Crisp Neon Trend Line */}
              <path
                d="M 50 10 L 150 25 L 250 50 L 350 18 L 450 35 L 550 20 L 650 12"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {[
                [50, 10, 0],
                [150, 25, 1],
                [250, 50, 2],
                [350, 18, 3],
                [450, 35, 4],
                [550, 20, 5],
                [650, 12, 6]
              ].map(([cx, cy, idx]) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r={selectedTimelineDay === idx ? "5.5" : "3.5"}
                  fill={selectedTimelineDay === idx ? "#ffffff" : "#06b6d4"}
                  stroke="#080d1a"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-6 transition-all"
                  onClick={() => setSelectedTimelineDay(idx)}
                />
              ))}
            </svg>
          </div>

          {/* Day Selector Buttons Footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
            {dailyHistory.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTimelineDay(idx)}
                className={`px-2 py-0.5 rounded-lg transition-all ${
                  selectedTimelineDay === idx
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50'
                    : 'hover:text-slate-200'
                }`}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Audit Card */}
        <div className="mt-2.5 p-2.5 rounded-xl bg-navy-900/60 border border-slate-800 flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-slate-400">{dailyHistory[selectedTimelineDay].date} Status:</span>
            <span className="text-white font-bold ml-1.5">{dailyHistory[selectedTimelineDay].status}</span>
          </div>
          <div className="text-emerald-400 font-bold">
            {dailyHistory[selectedTimelineDay].safetyScore}% {lang === 'hi' ? 'सुरक्षित' : 'Safety Score'}
          </div>
        </div>
      </div>
    </div>
  );
}
