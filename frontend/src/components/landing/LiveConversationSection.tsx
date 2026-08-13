'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Radio,
  PhoneCall,
  Bot,
  BarChart3,
  UserCheck,
  ShieldCheck,
  CreditCard,
  UserCog,
  Settings,
  Bell,
  Volume2,
  Mic,
  PhoneOff,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';

export const LiveConversationSection: React.FC = () => {
  const [selectedCallId, setSelectedCallId] = useState(1);

  const activeCalls = [
    { id: 1, name: 'Aarav Sharma', duration: '01:24', status: 'Q3 calls in progress', phone: '+91 9820134521 - Q3 React Bootcamp' },
    { id: 2, name: 'Meera Nair', duration: '00:42', status: 'MERN Stack Cohort', phone: '+91 9876543210 - MERN Stack' },
    { id: 3, name: 'Sahil Kapoor', duration: '03:18', status: 'UI/UX Masterclass', phone: '+91 9123456789 - UI/UX' },
    { id: 4, name: 'Sahil Kapoor', duration: '03:18', status: 'UI/UX Masterclass', phone: '+91 9123456789 - UI/UX' },
    { id: 5, name: 'Sahil Kapoor', duration: '03:18', status: 'UI/UX Masterclass', phone: '+91 9123456789 - UI/UX' },
    { id: 6, name: 'Sahil Kapoor', duration: '03:18', status: 'UI/UX Masterclass', phone: '+91 9123456789 - UI/UX' },
  ];

  const transcripts = [
    { sender: 'Lead', text: 'Yes, please go ahead.', isAi: false },
    { sender: 'AI Agent', text: "Great, I'm calling about the React bootcamp you enquired about.", isAi: true },
    { sender: 'Lead', text: "Yeah, I'm interested", isAi: false },
    { sender: 'AI Agent', text: 'Our next cohort starts Sep 1. Would a demo this Tuesday work?', isAi: true },
    { sender: 'Lead', text: "Yeah, I'm interested", isAi: false }
  ];

  return (
    <section
      className="w-full py-[36px] lg:py-[50px] px-4 sm:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/img/live-bg.jpg')" }}
    >
      <div className="relative z-10 max-w-[1200px] mx-auto flex flex-col items-center gap-[45px]">

        {/* SECTION 1: Glass Header Card (width: 1200px, padding: compact py-5 px-6 lg:px-8, bg: #FFFFFF1A, radius: 8px) */}
        <div className="w-full max-w-[1200px] bg-white/10 backdrop-blur-xl border border-white/25 rounded-[8px] p-5 lg:px-8 lg:py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">

          {/* Left Title: 555px */}
          <div className="w-full lg:max-w-[555px]">
            <h2 className="font-outfit font-normal text-3xl sm:text-4xl lg:text-[52px] leading-[1.15] lg:leading-[62px] tracking-[-0.02em] text-white">
              Know what your agents are saying - while they&apos;re saying it.
            </h2>
          </div>

          {/* Right Subtitle: 460px x 90px */}
          <div className="w-full lg:max-w-[460px]">
            <p className="font-outfit font-normal text-base sm:text-lg lg:text-[20px] leading-[26px] lg:leading-[30px] text-white/90">
              Monitor live conversations, review call outcomes, and understand how every prospect is responding. Closr gives your team visibility without requiring them to sit on every call.
            </p>
          </div>

        </div>

        {/* SECTION 2: Dashboard UI Card (width: 1150px, height: 695.75px, radius: 8px) */}
        <div className="w-full max-w-[1150px] min-h-[650px] lg:h-[695px] bg-white rounded-[12px] shadow-2xl overflow-hidden border border-slate-200 text-slate-800 flex flex-col">

          <div className="flex-1 flex overflow-hidden">

            {/* Sidebar Navigation (Left Panel) */}
            <aside className="w-[200px] lg:w-[220px] bg-white border-r border-slate-200 p-4 hidden md:flex flex-col justify-between shrink-0">

              <div className="space-y-6">
                {/* Logo */}
                <div className="px-2 py-1">
                  <span className="font-outfit font-bold text-2xl text-[#0A0A0A]">Logo</span>
                </div>

                {/* Sidebar Links */}
                <nav className="space-y-1 text-xs font-outfit">
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Megaphone className="w-4 h-4" />
                    <span>Campaigns</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Users className="w-4 h-4" />
                    <span>Leads</span>
                  </div>

                  {/* Active Item: Live Monitor */}
                  <div className="flex items-center space-x-3 px-3 py-2 bg-[#1A1A1A] text-white font-medium rounded-lg shadow-sm cursor-pointer">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Live Monitor</span>
                  </div>

                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Logs</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Bot className="w-4 h-4" />
                    <span>AI Config</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <UserCheck className="w-4 h-4" />
                    <span>User Management</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Compliance</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <UserCog className="w-4 h-4" />
                    <span>Super Admin</span>
                  </div>
                  <div className="flex items-center space-x-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </div>
                </nav>
              </div>

              {/* User Profile Block */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-700">
                  RA
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">Rahul Agarwal</div>
                  <div className="text-[11px] text-slate-500">Admin</div>
                </div>
              </div>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-slate-50/50 p-4 lg:p-6 flex flex-col justify-between overflow-y-auto">

              <div className="space-y-4">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-3 text-slate-600">
                    <SlidersHorizontal className="w-4 h-4 cursor-pointer" />
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Bell className="w-4 h-4 text-slate-500 cursor-pointer" />
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                      Wallet Balance: <strong>₹120.00</strong>
                    </div>
                    <button className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-black text-white font-medium rounded-lg flex items-center space-x-1 transition-colors">
                      <span>Go to AI Setup</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  </div>
                </div>

                {/* Subheader Banner */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 font-outfit font-bold text-base text-[#0A0A0A]">
                  6 calls in progress
                </div>

                {/* Content Grid (Calls List + Live Chat Monitor) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                  {/* Calls List (5 cols) */}
                  <div className="lg:col-span-5 space-y-2">
                    {activeCalls.map((call) => (
                      <div
                        key={call.id}
                        onClick={() => setSelectedCallId(call.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedCallId === call.id
                          ? 'bg-white border-slate-300 shadow-md ring-1 ring-slate-200'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                          }`}
                      >
                        <div>
                          <div className="font-outfit font-bold text-xs text-slate-900">{call.name}</div>
                          <div className="font-outfit text-[11px] text-slate-500 mt-0.5">{call.status}</div>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 font-medium">
                          {call.duration}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transcript Monitor Window (7 cols) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm min-h-[360px] flex flex-col justify-between">

                    <div>
                      {/* Call Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                        <div>
                          <div className="font-outfit font-bold text-sm text-slate-900">Aarav Sharma</div>
                          <div className="text-[11px] text-slate-500 font-mono">+91 9820134521 - Q3 React Bootcamp</div>
                        </div>

                        {/* Action Control Buttons */}
                        <div className="flex items-center space-x-2">
                          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                            <Mic className="w-3 h-3" />
                            <span>Whisper</span>
                          </button>
                          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center space-x-1">
                            <Volume2 className="w-3 h-3" />
                            <span>Barge in</span>
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-[#EF4444] hover:bg-red-600 text-white text-[11px] font-bold flex items-center space-x-1 shadow-sm">
                            <PhoneOff className="w-3 h-3" />
                            <span>End</span>
                          </button>
                        </div>
                      </div>

                      {/* Chat Bubbles Stream */}
                      <div className="py-4 space-y-3 font-outfit text-xs">
                        {transcripts.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col ${item.isAi ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${item.isAi
                                ? 'bg-[#1A1A1A] text-white rounded-br-none shadow-sm'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                                }`}
                            >
                              <div className="text-[10px] font-bold opacity-75 mb-0.5">
                                {item.sender}
                              </div>
                              <div>{item.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Active Knowledge Footer */}
                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Active Policy Knowledge: <strong className="text-slate-700">insurance-policy-v2</strong></span>
                      <span className="text-emerald-600 font-semibold">● Streaming Active</span>
                    </div>

                  </div>

                </div>
              </div>

            </main>
          </div>

        </div>

      </div>
    </section>
  );
};
