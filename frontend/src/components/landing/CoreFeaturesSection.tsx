'use client';

import React, { useState } from 'react';
import { Mic, Database, Layers, BarChart3, CheckCircle2 } from 'lucide-react';

export const CoreFeaturesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 0,
      icon: Mic,
      title: 'Streaming Voice AI Engine',
      category: 'TELEPHONY PIPELINE',
      subtitle: 'Ultra-Low Latency Conversational Pipeline',
      description: 'Built on asynchronous high-concurrency event streams. Handles bi-directional audio packets with zero network blocking for instant human-like speech flow.',
      points: [
        'Real-time streaming speech recognition',
        'Instant barge-in detection when prospect interrupts',
        'Natural multi-accent regional voice synthesis',
        'Automatic failover for high concurrency calls'
      ],
      previewTitle: 'Real-Time Voice Streaming Payload',
      previewCode: `{
  "session_id": "sess_8912401a",
  "status": "STREAMING_ACTIVE",
  "audio_latency_ms": 320,
  "barge_in_detected": false,
  "active_speaker": "AI_AGENT_PRIYA",
  "encryption": "AES_256_GCM"
}`
    },
    {
      id: 1,
      icon: Database,
      title: 'Verified Knowledge Engine',
      category: 'FACTUAL GROUNDING',
      subtitle: 'Upload Sales Scripts & Policy Documents for Factual Precision',
      description: 'Upload counseling booklets, insurance policy PDFs, or enterprise FAQs. The system indexes document knowledge to provide 100% accurate responses.',
      points: [
        'Automatic document parsing and semantic indexing',
        'Isolated knowledge namespace per organization',
        'Zero hallucination factual answer injection',
        'Dynamic document versioning and live updates'
      ],
      previewTitle: 'Knowledge Base Ingestion Status',
      previewCode: `POST /api/v1/tenant/upload-kb
Content-Type: multipart/form-data
Files: insurance_policy_handbook_v2.pdf

Response 200 OK:
{
  "status": "INDEXED_SUCCESS",
  "document_id": "doc_98124_v2",
  "chunks_indexed": 142,
  "accuracy_score": "99.8%",
  "tenant_isolation": "VERIFIED"
}`
    },
    {
      id: 2,
      icon: Layers,
      title: 'Multi-Tenant SaaS Workspace',
      category: 'ENTERPRISE ISOLATION',
      subtitle: 'Isolated Tenant Data, Role Access & Dynamic Usage',
      description: 'Built for enterprise multi-tenancy. Every organization operates in an isolated data layer with custom roles, settings, and wallet tracking.',
      points: [
        'Strict tenant-level security scoping',
        'Secure payment gateway integration',
        'Automated wallet deduction per call minute',
        'Custom prompt persona & tone customization'
      ],
      previewTitle: 'Tenant Workspace Status',
      previewCode: `{
  "tenant_id": "ae343198-727f-4449-bba4-d62203dacc5e",
  "company_name": "Star Health Insurance",
  "plan": "PRO_ENTERPRISE",
  "wallet_balance": "$240.50",
  "compliance_status": "ACTIVE_VERIFIED",
  "selected_agent": "Priya_Regional_Voice"
}`
    },
    {
      id: 3,
      icon: BarChart3,
      title: 'Outbound Campaign Dialer',
      category: 'AUTOMATED QUEUE',
      subtitle: 'Automated Lead Queues, AI Summaries & Sentiment Scoring',
      description: 'Scale outbound calling with automated campaign workers. Post-call pipeline automatically generates summaries, lead sentiment scores, and CRM sync.',
      points: [
        'Automated queue manager for high volume dialing',
        'AI call summarization & sentiment scoring',
        'Encrypted audio recording playback',
        'Real-time live call monitoring events'
      ],
      previewTitle: 'Post-Call AI Summary Output',
      previewCode: `{
  "call_id": "call_9812410a",
  "duration_seconds": 134,
  "disposition": "CONNECTED_SUCCESS",
  "lead_interest_score": "8.5 / 10",
  "summary": "Customer inquired about maternity waiting period. Confirmed 2-year rider clause. Sent WhatsApp quote link.",
  "sentiment": "POSITIVE"
}`
    }
  ];

  const currentTab = features[activeTab];

  return (
    <section id="features" className="py-24 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-800 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            Core Architecture & Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            CAPABILITIES BUILT FOR<br />
            <span className="text-amber-500 font-display uppercase block mt-1">ENTERPRISE SCALE.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Purpose-built voice AI architecture designed for low latency, factual accuracy, and high throughput.
          </p>
        </div>

        {/* 4 Feature Selector Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {features.map((f, idx) => {
            const Icon = f.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={f.id}
                onClick={() => setActiveTab(idx)}
                className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl border ${
                      isActive
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">0{idx + 1}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    {f.category}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                    {f.title}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feature Detail Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-10 shadow-xl shadow-slate-200/50">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-mono font-bold text-amber-800 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 inline-block">
                {currentTab.category}
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {currentTab.subtitle}
              </h3>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {currentTab.description}
              </p>

              <div className="space-y-3 pt-2">
                {currentTab.points.map((pt, i) => (
                  <div key={i} className="flex items-start space-x-3 text-xs sm:text-sm text-slate-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right System Execution Box */}
            <div className="lg:col-span-6">
              <div className="rounded-xl bg-slate-900 text-slate-100 p-5 font-mono text-xs shadow-inner overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-semibold text-white">{currentTab.previewTitle}</span>
                  </div>
                  <span className="text-amber-400 font-bold">Encrypted Payload</span>
                </div>

                <pre className="overflow-x-auto text-amber-200/90 leading-relaxed text-[11px]">
                  <code>{currentTab.previewCode}</code>
                </pre>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
