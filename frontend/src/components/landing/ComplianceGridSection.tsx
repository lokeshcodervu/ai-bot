'use client';

import React from 'react';
import { ShieldCheck, Lock, Award, Server, Key, CheckCircle2 } from 'lucide-react';

export const ComplianceGridSection: React.FC = () => {
  const standards = [
    {
      icon: Award,
      title: 'SOC2 & ISO 27001 Ready',
      description: 'Built following SOC2 Type II trust principles and ISO 27001 data security standards.',
      badge: 'Certified Architecture',
    },
    {
      icon: ShieldCheck,
      title: 'DND & TRAI Compliance',
      description: 'Real-time checking against national Do-Not-Call databases prior to dialer queue execution.',
      badge: 'TRAI Compliant',
    },
    {
      icon: Lock,
      title: '256-Bit SSL Encryption',
      description: 'All audio streams and data payloads are encrypted end-to-end using TLS 1.3 & AES-256.',
      badge: 'AES-256 Bit',
    },
    {
      icon: Server,
      title: '99.99% Telephony Uptime SLA',
      description: 'Redundant cloud node clusters ensure active telephony calls remain connected with zero downtime.',
      badge: 'High Availability',
    },
    {
      icon: Key,
      title: 'Role-Based Access Control',
      description: 'Granular permissions for Business Owners, Campaign Managers, and Auditor roles.',
      badge: 'RBAC Enforced',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-blue-600 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200">
            Enterprise Security Standards
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Built to the Highest Standard.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Enterprise-grade security controls designed for regulated insurance, banking, and healthcare operations.
          </p>
        </div>

        {/* 5 Grid Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {standards.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-blue-600 w-fit mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-blue-600 font-semibold">
                  <span>{s.badge}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
