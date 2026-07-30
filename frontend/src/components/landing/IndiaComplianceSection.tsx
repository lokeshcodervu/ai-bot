'use client';

import React from 'react';
import { ShieldCheck, Clock, MapPin, Radio, Lock, CheckCircle2 } from 'lucide-react';

export const IndiaComplianceSection: React.FC = () => {
  const MetroHubs = [
    { city: 'Delhi NCR', region: 'North Hub', latency: '12ms' },
    { city: 'Mumbai', region: 'West Hub', latency: '8ms' },
    { city: 'Bengaluru', region: 'South Hub', latency: '14ms' },
    { city: 'Hyderabad', region: 'Central Hub', latency: '16ms' },
    { city: 'Chennai', region: 'South East', latency: '18ms' },
    { city: 'Kolkata', region: 'East Hub', latency: '22ms' },
  ];

  const compliancePoints = [
    {
      icon: ShieldCheck,
      title: 'TRAI DND Registry Scrubbing',
      description: 'Every phone number is dynamically checked against national Do-Not-Disturb registries before dialer execution.',
      badge: 'TRAI Compliant',
      color: 'text-emerald-600',
    },
    {
      icon: Clock,
      title: 'Automated Calling Hours Filter',
      description: 'System automatically restricts outbound dialing campaigns strictly between 09:00 AM and 08:00 PM local time.',
      badge: 'Time Scoped',
      color: 'text-amber-600',
    },
    {
      icon: Radio,
      title: 'Regional Indian Speech Engine',
      description: 'Integrated with regional speech engine for natural Hinglish, Hindi, and South Indian regional accents.',
      badge: 'Native Accent',
      color: 'text-indigo-600',
    },
    {
      icon: Lock,
      title: 'Encrypted Audio Storage',
      description: 'All telephony recordings are encrypted at rest with AES-256 keys and accessible only via short-lived signed access.',
      badge: 'AES-256 Bit',
      color: 'text-slate-900',
    },
  ];

  return (
    <section id="compliance" className="py-24 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-800 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            Regulatory Telephony Compliance
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            BUILT GROUND-UP FOR<br />
            <span className="text-amber-500 font-display uppercase block mt-1">REGULATED OPERATIONS.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Complete peace of mind with TRAI regulations, DND scrubbing, encrypted telephony streams, and multi-tenant isolation.
          </p>
        </div>

        {/* Regional Telephony Node Hubs Bar */}
        <div className="mb-14 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>Low-Latency Indian Telephony Node Network</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Direct carrier SIP connectivity paired with localized voice media gateways.</p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span>All 6 Regional Hubs Online</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MetroHubs.map((h, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 text-center hover:border-amber-500/40 transition-colors">
                <div className="text-xs font-mono text-amber-600 font-bold">{h.latency}</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{h.city}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{h.region}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Compliance Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {compliancePoints.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-amber-50/80 border border-amber-200 ${c.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {c.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Enforced Automatically</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
