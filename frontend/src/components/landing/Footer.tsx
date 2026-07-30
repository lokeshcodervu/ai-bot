'use client';

import React from 'react';
import { Bot, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 py-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <a href="#" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight font-display uppercase">TeleBot</span>
                <span className="text-xl font-black text-amber-500 tracking-tight font-display uppercase">AI</span>
              </div>
            </a>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Autonomous conversational voice AI telephony platform for regulated insurance, counseling, and enterprise sales operations. Built for real-time streaming speech, verified policy grounding, and bank-grade data security.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SOC2 Type II & TRAI DND Compliant</span>
            </div>
          </div>

          {/* Product Col */}
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#features" className="hover:text-amber-500 transition-colors font-medium">Voice AI Engine</a></li>
              <li><a href="#workflow" className="hover:text-amber-500 transition-colors font-medium">Automated Dialer</a></li>
              <li><a href="#multilingual" className="hover:text-amber-500 transition-colors font-medium">Multilingual Speech Engine</a></li>
              <li><a href="#compliance" className="hover:text-amber-500 transition-colors font-medium">DND Scrubbing</a></li>
              <li><a href="#impact" className="hover:text-amber-500 transition-colors font-medium">ROI Calculator</a></li>
              <li><a href="#pricing" className="hover:text-amber-500 transition-colors font-medium">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Architecture Col */}
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-4">Security & Scale</h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li><span>Low-Latency Audio Streaming</span></li>
              <li><span>Verified Knowledge Indexing</span></li>
              <li><span>High-Volume Campaign Dialer</span></li>
              <li><span>Isolated Enterprise Data</span></li>
              <li><span>AES-256 Audio Encryption</span></li>
            </ul>
          </div>

          {/* Legal & Docs Col */}
          <div>
            <h4 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wider mb-4">Legal & Docs</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-amber-500 transition-colors font-medium">API Overview</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors font-medium">Enterprise Security</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors font-medium">Privacy & Compliance</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors font-medium">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 TeleBot AI. All rights reserved.
          </div>
          <div>
            Engineered for Regulated Telephony & Sales Operations.
          </div>
        </div>

      </div>
    </footer>
  );
};
