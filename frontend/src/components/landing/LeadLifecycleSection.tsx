'use client';

import React from 'react';
import { Upload, Bot, Megaphone, Rocket, BarChart3, Search, Plus, Filter, ArrowUpRight } from 'lucide-react';

export const LeadLifecycleSection: React.FC = () => {
  const steps = [
    {
      id: 1,
      icon: <Upload className="w-[36px] h-[36px] text-[#0A0A0A]" />,
      title: 'Upload your leads',
      description:
        'Upload your existing leads in seconds and let TeleBot organize them into a ready-to-call pipeline.',
      gradient: 'from-blue-200 via-indigo-100 to-purple-200',
      mockup: (
        <div className="w-full h-full bg-white rounded-[8px] p-4 font-outfit text-xs space-y-3 border border-slate-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[#0A0A0A]">Logo</span>
              <span className="text-[10px] text-slate-400">/ Leads</span>
            </div>
            <button className="px-2.5 py-1 bg-[#1A1A1A] text-white rounded text-[10px] font-medium flex items-center space-x-1">
              <Plus className="w-3 h-3" />
              <span>Import CSV</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-500">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Search leads by name or phone...</span>
            </div>
            <button className="px-2 py-1.5 border border-slate-200 rounded text-slate-600 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span className="text-[10px]">Filter</span>
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-50 grid grid-cols-5 p-2 font-bold text-[10px] text-slate-500 border-b border-slate-200">
              <span>Name</span>
              <span>Phone</span>
              <span>Campaign</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {[
              { name: 'Rahul Sharma', phone: '+91 98201 34521', camp: 'Health Q3', status: 'DND Passed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { name: 'Ananya Sen', phone: '+91 98765 43210', camp: 'Auto Renew', status: 'DND Passed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { name: 'Vikram Mehta', phone: '+91 91234 56789', camp: 'Term Life', status: 'Queued', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { name: 'Priya Nair', phone: '+91 99887 76655', camp: 'Health Q3', status: 'DND Passed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-5 p-2 text-[10px] border-b border-slate-100 items-center">
                <span className="font-semibold text-slate-900">{row.name}</span>
                <span className="text-slate-500 font-mono">{row.phone}</span>
                <span className="text-slate-600">{row.camp}</span>
                <span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${row.color}`}>
                    {row.status}
                  </span>
                </span>
                <span className="text-slate-400 hover:text-slate-900 cursor-pointer font-semibold">View</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      icon: <Bot className="w-[36px] h-[36px] text-[#0A0A0A]" />,
      title: 'Configure your AI agent',
      description:
        'Set your agent\'s voice, custom prompt, and knowledge base to match your exact brand guidelines.',
      gradient: 'from-cyan-200 via-sky-100 to-blue-200',
      mockup: (
        <div className="w-full h-full bg-white rounded-[8px] p-4 font-outfit text-xs space-y-3 border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-bold text-sm text-[#0A0A0A]">AI Agent Configuration</div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">Active Model</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-600">Agent Voice Selection</label>
              <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 flex justify-between items-center text-[11px]">
                <span>Priya — Ultra Natural Indian English (Female)</span>
                <span className="text-emerald-600 text-[9px]">Sub-400ms</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600">System Prompt & Behavior</label>
              <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 font-mono h-16 overflow-hidden">
                You are a senior health insurance advisor at Star Health. Counsel customers on policy renewals with verified 10% no-claim bonus...
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-600">Knowledge Base Document</label>
              <div className="mt-1 p-2 border border-dashed border-slate-300 rounded bg-white flex items-center justify-between text-[10px]">
                <span className="font-medium text-slate-800">📄 insurance-policy-handbook-v2.pdf</span>
                <span className="text-emerald-600 font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      icon: <Megaphone className="w-[36px] h-[36px] text-[#0A0A0A]" />,
      title: 'Set up your campaign',
      description:
        'Assign calling schedules, retry limits, and regional routing rules to reach leads at the optimal time.',
      gradient: 'from-purple-200 via-pink-100 to-rose-200',
      mockup: (
        <div className="w-full h-full bg-white rounded-[8px] p-4 font-outfit text-xs space-y-3 border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-bold text-sm text-[#0A0A0A]">Campaign Schedule & Rules</div>
            <button className="px-2.5 py-1 bg-[#1A1A1A] text-white rounded text-[10px] font-medium">Save Campaign</button>
          </div>

          <div className="space-y-3 text-[11px]">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
              <span className="font-medium text-slate-700">Calling Window</span>
              <span className="font-bold text-slate-900">09:00 AM — 07:00 PM (IST)</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
              <span className="font-medium text-slate-700">Max Retry Attempts</span>
              <span className="font-bold text-slate-900">3 Retries (If Busy/No Answer)</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
              <span className="font-medium text-slate-700">DND Registry Scrubbing</span>
              <span className="font-bold text-emerald-600">100% Strict TRAI Enforcement</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      icon: <Rocket className="w-[36px] h-[36px] text-[#0A0A0A]" />,
      title: 'Launch & start automated calling',
      description:
        'Your AI agents begin dialing prospects automatically with sub-400ms ultra-low latency.',
      gradient: 'from-emerald-200 via-teal-100 to-cyan-200',
      mockup: (
        <div className="w-full h-full bg-white rounded-[8px] p-4 font-outfit text-xs space-y-3 border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-sm text-[#0A0A0A]">Active Outbound Dialing</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">Speed: 50 calls/min</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[9px] text-slate-500 uppercase">Dialed</div>
              <div className="font-bold text-base text-slate-900">1,284</div>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-[9px] text-emerald-700 uppercase">Connected</div>
              <div className="font-bold text-base text-emerald-700">942</div>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded">
              <div className="text-[9px] text-amber-700 uppercase">Converted</div>
              <div className="font-bold text-base text-amber-700">318</div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 text-white rounded text-[10px] font-mono flex items-center justify-between">
            <span>Stream Status: Ultra-Low Latency Active</span>
            <span className="text-emerald-400 font-bold">&lt; 380 ms</span>
          </div>
        </div>
      )
    },
    {
      id: 5,
      icon: <BarChart3 className="w-[36px] h-[36px] text-[#0A0A0A]" />,
      title: 'Review results in CRM',
      description:
        'Track call summaries, sentiment scores, and outcome analytics instantly synced with your CRM.',
      gradient: 'from-amber-100 via-orange-100 to-amber-200',
      mockup: (
        <div className="w-full h-full bg-white rounded-[8px] p-4 font-outfit text-xs space-y-3 border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-sm text-[#0A0A0A]">Analytics & Performance Report</span>
            <button className="text-[10px] text-slate-600 border border-slate-200 rounded px-2 py-0.5 flex items-center space-x-1">
              <span>Export CSV</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[8px] text-slate-500">Total Calls</div>
              <div className="font-bold text-sm text-slate-900">1,284</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[8px] text-slate-500">Talk Time</div>
              <div className="font-bold text-sm text-slate-900">78h</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[8px] text-slate-500">CSAT Score</div>
              <div className="font-bold text-sm text-emerald-600">94%</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
              <div className="text-[8px] text-slate-500">ROI Impact</div>
              <div className="font-bold text-sm text-amber-600">4.2x</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="w-full bg-white py-[60px] px-6 sm:px-[40px] lg:px-[60px] border-b border-neutral-200">
      <div className="max-w-[1320px] mx-auto space-y-10">

        {/* Section Headline Block */}
        <div className="space-y-3 max-w-[808px]">
          <h2 className="font-outfit font-normal text-3xl sm:text-4xl lg:text-[48px] leading-[1.2] text-[#0A0A0A] tracking-tight">
            From Zero to Calling in Minutes
          </h2>
          <p className="font-outfit font-normal text-base sm:text-[20px] leading-[26px] sm:leading-[30px] text-[#6D8A96] max-w-[808px] min-h-[60px]">
            Set up your sales agent, connect your leads, and launch your first campaign without building complicated automation.
          </p>
        </div>

        {/* 5 Overlapping Cards Track (Aligned perfectly with title margin) */}
        <div className="relative space-y-0 pb-16">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              style={{
                position: 'sticky',
                top: '120px',
                zIndex: (idx + 1) * 10,
              }}
              className="w-full max-w-[1320px] bg-white py-[24px] lg:py-[32px] flex flex-col lg:flex-row items-center justify-between gap-[36px] lg:gap-[50px] rounded-[24px] overflow-hidden transition-all duration-300"
            >
              {/* 1. Left Image / Gradient Card (760px x 460px) */}
              <div
                className={`w-full lg:w-[760px] h-[360px] sm:h-[420px] lg:h-[460px] rounded-[20px] bg-gradient-to-br ${step.gradient} p-5 sm:p-[32px] flex items-center justify-center shadow-sm relative overflow-hidden flex-shrink-0`}
              >
                {/* 2. Inner Dashboard UI Card */}
                <div className="w-full lg:w-[680px] h-[300px] sm:h-[350px] lg:h-[390px] rounded-[12px] bg-white border border-white/80 shadow-2xl overflow-hidden p-2 sm:p-4">
                  {step.mockup}
                </div>
              </div>

              {/* 3. Right Text Content Block (480px) */}
              <div className="w-full lg:w-[480px] flex flex-col justify-center gap-[16px]">
                {/* Icon */}
                <div className="shrink-0">{step.icon}</div>

                {/* Title */}
                <h3 className="font-outfit font-normal text-2xl sm:text-[32px] leading-[40px] text-[#0A0A0A] tracking-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="font-outfit font-normal text-base sm:text-[18px] leading-[28px] text-[#6D8A96]">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
