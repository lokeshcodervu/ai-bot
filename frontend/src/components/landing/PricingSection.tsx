'use client';

import React from 'react';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface PricingSectionProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuthModal }) => {
  const plans = [
    {
      name: 'Starter Plan',
      price: '$49',
      period: '/ month',
      description: 'Perfect for small teams and single product campaigns looking to test AI voice dialing.',
      popular: false,
      ctaText: 'Start Free 14-Day Trial',
      features: [
        '1,000 outbound call minutes / mo',
        '1 Active Voice AI Agent Persona',
        'Natural Human Voice Models',
        'Instant Carrier Telephony Connection',
        'Basic CSV Lead Upload',
        'Email Support & Call Transcript Logs'
      ]
    },
    {
      name: 'Pro Enterprise',
      price: '$199',
      period: '/ month',
      description: 'Ideal for growing sales, insurance, and counseling teams needing verified document precision.',
      popular: true,
      ctaText: 'Launch Pro Workspace',
      features: [
        '5,000 outbound call minutes / mo',
        'Unlimited AI Agent Personas',
        'Document Knowledge Base (Upload PDFs)',
        'Regional Multilingual Voices (Hindi, Hinglish, South Indian)',
        'Automated Outbound Campaign Dialer',
        'TRAI DND Registry Filter',
        'Instant CRM Webhook Sync',
        'Priority Technical Support'
      ]
    },
    {
      name: 'Scale Custom',
      price: 'Custom',
      period: '',
      description: 'Tailored for high-volume enterprise call centers requiring dedicated capacity & SLAs.',
      popular: false,
      ctaText: 'Contact Enterprise Team',
      features: [
        'Unlimited Call Minutes & Concurrent Streams',
        'Custom Enterprise Voice Cloning',
        'High-Volume Enterprise Throughput',
        'Dedicated Enterprise Data Partitioning',
        'Custom Private Cloud / On-Premise Deployment',
        'Dedicated Solutions Architect & 99.99% SLA'
      ]
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50 border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-800 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            Simple & Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            PREDICTABLE PLANS<br />
            <span className="text-amber-500 font-display uppercase block mt-1">FOR EVERY SCALE.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            No surprise fees or hidden telephony surcharges. Start with a 14-day free trial workspace.
          </p>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl bg-white border flex flex-col justify-between relative transition-all ${
                p.popular
                  ? 'border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20'
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>MOST POPULAR</span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2 font-display uppercase tracking-tight">{p.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{p.description}</p>

                <div className="flex items-baseline space-x-1 mb-6 pb-6 border-b border-slate-100">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">{p.price}</span>
                  <span className="text-sm font-semibold text-slate-500">{p.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Included Features:
                  </span>
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onOpenAuthModal('signup')}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                  p.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <span>{p.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
