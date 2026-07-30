'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does TeleBot AI handle regional Indian accents and Hinglish?",
      a: "TeleBot AI integrates real-time speech-to-text recognition and native voice synthesis. This provides human-level accuracy for Hindi, Hinglish code-switching, Tamil, Telugu, and Marathi accents."
    },
    {
      q: "How does the verified Knowledge Base prevent AI hallucinations?",
      a: "When a prospect asks a question about policy riders or pricing, the system queries your uploaded PDF handbook under your isolated workspace. Matching ground-truth text context is provided strictly instructing the agent to only state verified document facts."
    },
    {
      q: "Is TeleBot AI compliant with TRAI DND regulations in India?",
      a: "Yes. Every phone number in your campaign list is dynamically scrubbed against the National Do-Not-Disturb (DND) registry prior to dialer execution. Outbound calling is also automatically restricted to permissible hours (09:00 AM – 08:00 PM)."
    },
    {
      q: "How low is the voice streaming turnaround latency?",
      a: "The entire pipeline—from audio streaming input, speech recognition, reasoning, to voice synthesis output—operates asynchronously with sub-400ms turnaround latency for natural human speech flow."
    },
    {
      q: "Can I push call transcripts and audio recordings to my existing CRM?",
      a: "Yes. The post-call pipeline automatically generates a structured call summary, lead sentiment score, encrypted audio recording access, and transcript JSON, which are immediately pushed via webhooks to HubSpot, LeadSquared, Salesforce, or Zoho."
    }
  ];

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-blue-600 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything You Need to Know.
          </h2>
          <p className="text-slate-600 text-base">
            Have questions about telephony integration, speech models, or compliance? We have answers.
          </p>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between space-x-4 focus:outline-none"
                >
                  <span className="text-base font-bold text-slate-900">{faq.q}</span>
                  <div className={`p-1.5 rounded-lg bg-slate-100 text-slate-600 transition-transform ${isOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
