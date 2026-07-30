'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CallToActionSectionProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ onOpenAuthModal }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenAuthModal('signup');
  };

  return (
    <section className="py-20 bg-white text-slate-900 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border border-amber-500 p-8 sm:p-12 lg:p-16 text-center space-y-8 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden">
          
          {/* Top Tagline */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/20 text-white text-xs font-bold uppercase tracking-widest">
            <span>Launch Your Voice AI Telephony Agent Today</span>
          </div>

          {/* Headline matching image style */}
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white font-display uppercase">
            SEE TELEBOT AI HANDLE<br />
            <span className="text-amber-100 font-display uppercase block mt-1">Your Telecalling & Sales Ops.</span>
          </h2>

          <p className="text-amber-50 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Deploy your first autonomous voice agent in less than 10 minutes. Upload your sales script PDF and start dialing leads with sub-400ms latency.
          </p>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your work email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-4 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors shadow-sm"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Guarantees Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-amber-100 font-semibold">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>14-Day Free Trial</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-200" />
              <span>Instant Workspace Setup</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
