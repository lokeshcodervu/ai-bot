'use client';

import React from 'react';
import { Zap, ShieldCheck, Database, Layers } from 'lucide-react';

export const MetricsBar: React.FC = () => {
  const metrics = [
    {
      icon: Zap,
      label: 'Streaming Latency',
      value: '<400 ms',
      subtext: 'Real-Time Voice Streaming',
      color: 'text-amber-500',
    },
    {
      icon: ShieldCheck,
      label: 'DND Compliance',
      value: '100% Scrubbed',
      subtext: 'TRAI Regulatory Compliance',
      color: 'text-emerald-600',
    },
    {
      icon: Database,
      label: 'Factual Accuracy',
      value: 'Zero Hallucination',
      subtext: 'Verified Knowledge Indexing',
      color: 'text-amber-600',
    },
    {
      icon: Layers,
      label: 'Tenant Security',
      value: 'Isolated SaaS',
      subtext: 'Enterprise Multi-Tenant Data',
      color: 'text-slate-900',
    },
  ];

  return (
    <section className="py-14 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex items-center space-x-4 shadow-sm hover:shadow"
              >
                <div className={`p-3 rounded-xl bg-amber-50/80 border border-amber-200 ${m.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">{m.value}</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{m.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{m.subtext}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
