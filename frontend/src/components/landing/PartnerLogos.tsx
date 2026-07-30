'use client';

import React from 'react';
import { Shield, Building, Award, CheckCircle } from 'lucide-react';

export const PartnerLogos: React.FC = () => {
  const partners = [
    { name: 'Star Health Insurance', badge: 'Health Insurance' },
    { name: 'HDFC ERGO General', badge: 'General Insurance' },
    { name: 'ICICI Lombard', badge: 'General Insurance' },
    { name: 'PolicyBazaar Enterprise', badge: 'Insurance Marketplace' },
    { name: 'Care Health Insurance', badge: 'Health & Wellness' },
    { name: 'Niva Bupa Health', badge: 'Health Insurance' }
  ];

  return (
    <section className="py-10 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 mb-6">
          Trusted by leading regulated insurance & enterprise financial institutions
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center">
          {partners.map((p, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center hover:border-blue-500/40 hover:shadow transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-1.5">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center leading-tight">{p.name}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{p.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
