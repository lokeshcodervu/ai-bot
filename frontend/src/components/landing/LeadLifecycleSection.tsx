'use client';

import React, { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export const LeadLifecycleSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stepNum: '01',
      title: 'Capture & Scrub Lead',
      short: 'Step 1: Capture Lead',
      description: 'Upload lead CSVs or stream via webhooks. System automatically scrubs phone numbers against National DND registries.',
      badge: 'DND Scrubbed',
      preview: {
        title: 'Lead Intake Record',
        items: [
          { label: 'Prospect Name', value: 'Rahul Sharma (Delhi)' },
          { label: 'Policy Type', value: 'Health Optima Multi-Cap' },
          { label: 'DND Status', value: 'PASSED (Clean)' },
          { label: 'Queue Status', value: 'READY_TO_DIAL' }
        ]
      }
    },
    {
      stepNum: '02',
      title: 'Automated Outbound Queue',
      short: 'Step 2: AI Qualification',
      description: 'Automated queue manager dispatches outbound dialers. Phone connects and initiates encrypted dual-stream audio channel.',
      badge: 'Automated Queue',
      preview: {
        title: 'Call Session Payload',
        items: [
          { label: 'Call SID', value: 'CA89310a28f9e11' },
          { label: 'Speech Recognition', value: 'Real-time Hinglish Engine' },
          { label: 'Voice Synthesis', value: 'Priya (Regional Voice)' },
          { label: 'Status', value: 'ENCRYPTED_STREAM_ACTIVE' }
        ]
      }
    },
    {
      stepNum: '03',
      title: 'Real-Time Voice Call',
      short: 'Step 3: Call Customer',
      description: 'AI agent converses in natural tone. Customer questions query Enterprise Knowledge Base under isolated workspace to prevent hallucinations.',
      badge: 'Verified Policy Match',
      preview: {
        title: 'Knowledge Match Status',
        items: [
          { label: 'Query', value: '"What is waiting period for pre-existing parents?"' },
          { label: 'Document', value: 'Section 4.2 - Senior Citizen Rider' },
          { label: 'Match Score', value: '0.942 (Exact Match)' },
          { label: 'Response', value: 'GROUND_TRUTH_VERIFIED' }
        ]
      }
    },
    {
      stepNum: '04',
      title: 'AI Summary & Analytics',
      short: 'Step 4: AI Summary',
      description: 'AI Engine generates call summary, lead interest score (8.5/10), sentiment tag, and complete dialogue transcript.',
      badge: 'AI Summary Engine',
      preview: {
        title: 'Call Disposition Output',
        items: [
          { label: 'Outcome', value: 'INTERESTED_RENEWAL' },
          { label: 'Sentiment', value: 'POSITIVE (8.8/10)' },
          { label: 'Next Action', value: 'Send WhatsApp Quote' },
          { label: 'Duration', value: '2 mins 14 secs' }
        ]
      }
    },
    {
      stepNum: '05',
      title: 'CRM Sync & Sale Closed',
      short: 'Step 5: Sales Closed',
      description: 'Automatic webhook dispatches structured call outcome, encrypted recording access, and updated lead state to your CRM.',
      badge: 'Instant CRM Sync',
      preview: {
        title: 'CRM Webhook Status',
        items: [
          { label: 'Target System', value: 'HubSpot / LeadSquared' },
          { label: 'Audio Record', value: 'Encrypted Stream Link' },
          { label: 'Lead State', value: 'QUALIFIED_SALES_READY' },
          { label: 'Response Code', value: 'HTTP 200 OK (0.4s)' }
        ]
      }
    }
  ];

  const currentStep = steps[activeStep];

  return (
    <section id="workflow" className="py-24 bg-slate-50 border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-800 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            End-to-End Workflow Timeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            FROM LEAD TO RENEWAL.<br />
            <span className="text-amber-500 font-display uppercase block mt-1">Every Call Automated.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            A continuous automated pipeline that qualifies leads, executes calls, queries knowledge, and syncs results to your CRM.
          </p>
        </div>

        {/* Timeline Steps Header Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-white border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono font-bold ${isActive ? 'text-amber-600' : 'text-slate-400'}`}>
                    STEP {s.stepNum}
                  </span>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                </div>
                <div className={`text-sm font-bold leading-snug ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                  {s.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Timeline Inspector Panel */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 shadow-xl shadow-slate-200/50">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  PHASE {currentStep.stepNum} OF 05
                </span>
                <span className="text-xs text-slate-500 font-semibold">• {currentStep.badge}</span>
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900">
                {currentStep.title}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {currentStep.description}
              </p>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous Step
                </button>

                <button
                  disabled={activeStep === steps.length - 1}
                  onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                  className="px-5 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs shadow hover:bg-amber-600 disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Card Inspection Details */}
            <div className="lg:col-span-6">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{currentStep.preview.title}</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                    Active System Status
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentStep.preview.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200/60 last:border-0 text-xs sm:text-sm">
                      <span className="text-slate-600 font-medium">{item.label}</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
