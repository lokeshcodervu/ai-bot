'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import {
  Radio,
  Volume2,
  Mic,
  PhoneOff,
  VolumeX,
  ChevronRight,
  User,
  Activity,
  Bot
} from 'lucide-react';

interface TranscriptItem {
  speaker: 'LEAD' | 'AI AGENT';
  text: string;
  isSpecial?: boolean; // For green border on lead, or cursor on AI
}

interface ActiveCall {
  id: string; // lead_id
  name: string;
  phone: string;
  campaign: string;
  campaignId: string;
  timer: number; // in seconds
  transcript: TranscriptItem[];
}

import API_BASE from '../../../config/api';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

export default function LiveMonitorPage() {
  const { token } = useStore();
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string>('');
  const [whisperActive, setWhisperActive] = useState<boolean>(false);
  const [bargeActive, setBargeActive] = useState<boolean>(false);
  
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Active call details helper
  const selectedCall = calls.find(c => c.id === selectedCallId) || null;

  // Auto scroll to bottom of transcript when transcript length changes
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCall?.transcript]);

  // Increment call timers in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCalls(prevCalls =>
        prevCalls.map(c => ({
          ...c,
          timer: c.timer + 1
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial campaigns and leads to build the list of currently active calls
  useEffect(() => {
    if (!token) return;

    const loadInitialData = async () => {
      try {
        // 1. Fetch campaigns
        const campaignsRes = await fetch(`${API_BASE}/campaigns`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        let campaignsData = [];
        if (campaignsRes.ok) {
          campaignsData = await campaignsRes.json();
          setCampaignsList(campaignsData);
        }

        // 2. Fetch leads
        const leadsRes = await fetch(`${API_BASE}/leads`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setAllLeads(leadsData);

          // 3. Build active calls from leads whose status is 'Connected'
          const activeLeads = leadsData.filter((l: any) => l.status === 'Connected');
          const initialActiveCalls: ActiveCall[] = activeLeads.map((lead: any) => {
            const campaign = campaignsData.find((c: any) => c.id === lead.campaign_id);
            return {
              id: lead.id,
              name: lead.name,
              phone: lead.phone,
              campaign: campaign ? campaign.name : 'Outbound Call',
              campaignId: lead.campaign_id || 'single-call',
              timer: lead.last_call_at 
                ? Math.max(0, Math.floor((Date.now() - new Date(lead.last_call_at).getTime()) / 1000))
                : 0,
              transcript: lead.transcript || []
            };

          });

          setCalls(initialActiveCalls);
          if (initialActiveCalls.length > 0) {
            setSelectedCallId(initialActiveCalls[0].id);
          }
        }
      } catch (err) {
        console.error("Error loading initial live monitor data:", err);
      }
    };

    loadInitialData();
  }, [token]);

  // Helper to fetch details for a newly connected lead and add it to the active calls list
  const fetchLeadDetailsAndAddCall = async (leadId: string, campaignId: string, campaignName: string) => {
    if (!token) return;
    try {
      const leadsRes = await fetch(`${API_BASE}/leads`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setAllLeads(leadsData);

        const leadDetails = leadsData.find((l: any) => l.id === leadId);
        const leadName = leadDetails ? leadDetails.name : 'Active Prospect';
        const leadPhone = leadDetails ? leadDetails.phone : 'In Progress';

        setCalls(prevCalls => {
          if (prevCalls.some(c => c.id === leadId)) return prevCalls;
          const newCall: ActiveCall = {
            id: leadId,
            name: leadName,
            phone: leadPhone,
            campaign: campaignName,
            campaignId: campaignId || 'single-call',
            timer: 0,
            transcript: []
          };

          
          setSelectedCallId(prev => prev || leadId);
          return [...prevCalls, newCall];
        });
      }
    } catch (err) {
      console.error("Error fetching lead details for active call:", err);
    }
  };

  // Manage campaign status WebSockets for all campaigns + single-call
  useEffect(() => {
    if (!token) return;

    const sockets: WebSocket[] = [];
    const targets = [
      ...campaignsList.map(c => ({ id: c.id, name: c.name })),
      { id: 'single-call', name: 'Single Call' }
    ];

    targets.forEach(target => {
      const wsUrl = `${WS_BASE}/campaigns/${target.id}/ws?token=${token}`;
      console.log(`Connecting to campaign status WS: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`Campaign ${target.name} WS event:`, data);

          if (data.event === 'status_update' && data.lead_id) {
            const leadId = data.lead_id;
            const status = data.status;

            if (status === 'Connected') {
              fetchLeadDetailsAndAddCall(leadId, target.id, target.name);
            } else if (['Converted', 'Busy', 'No Answer', 'Not Interested', 'Needs Follow-up'].includes(status)) {
              setCalls(prevCalls => {
                const remaining = prevCalls.filter(c => c.id !== leadId);
                setSelectedCallId(prev => {
                  if (prev === leadId) {
                    return remaining.length > 0 ? remaining[0].id : '';
                  }
                  return prev;
                });
                return remaining;
              });
            }
          }
        } catch (err) {
          console.error("Error parsing campaign status update:", err);
        }
      };

      ws.onerror = (err) => {
        console.error(`Campaign WS error for ${target.name}:`, err);
      };

      sockets.push(ws);
    });

    return () => {
      sockets.forEach(ws => ws.close());
    };
  }, [campaignsList, token]);

  // Manage transcript streaming for the selected call
  useEffect(() => {
    if (!selectedCallId || !selectedCall || !token) return;

    const campaignId = selectedCall.campaignId;
    if (!campaignId) return;

    const wsUrl = `${WS_BASE}/campaigns/${campaignId}/leads/${selectedCallId}/transcript/ws?token=${token}`;
    console.log(`Connecting to transcript WS: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Transcript message received:", data);

        if (data.speaker && data.text) {
          const speakerMapped = data.speaker === 'AI' ? 'AI AGENT' as const : 'LEAD' as const;

          setCalls(prevCalls =>
            prevCalls.map(c => {
              if (c.id === selectedCallId) {
                // Prevent duplicate messages if already present
                const isDuplicate = c.transcript.some(
                  t => t.speaker === speakerMapped && t.text === data.text
                );
                if (isDuplicate) return c;

                return {
                  ...c,
                  transcript: [
                    ...c.transcript,
                    { speaker: speakerMapped, text: data.text, isSpecial: data.speaker === 'AI' }
                  ]
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.error("Error parsing transcript message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Transcript WS error:", err);
    };

    return () => {
      console.log(`Closing transcript WS for lead ${selectedCallId}`);
      ws.close();
    };
  }, [selectedCallId, token]);

  // Reset stream states when switching calls
  const handleSelectCall = (id: string) => {
    setSelectedCallId(id);
    setWhisperActive(false);
    setBargeActive(false);
  };

  // End a call locally and on the backend
  const handleEndCall = async (id: string) => {
    try {
      await fetch(`${API_BASE}/leads/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Needs Follow-up' })
      });
    } catch (err) {
      console.error("Error updating lead status on backend ending call:", err);
    }

    const remainingCalls = calls.filter(c => c.id !== id);
    setCalls(remainingCalls);
    if (selectedCallId === id && remainingCalls.length > 0) {
      setSelectedCallId(remainingCalls[0].id);
    }
    alert(`Call for prospect ended.`);
  };

  // Helper to format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 text-slate-800">

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight flex items-center gap-2">
            Live Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Listen and monitor active AI outbound calls in real-time</p>
        </div>
      </div>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* LEFT COLUMN: CALLS LIST */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {/* List Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold font-outfit text-slate-900 tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              {calls.length} calls in progress
            </h3>
          </div>

          {/* List Items */}
          <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {calls.map((call) => {
              const isSelected = call.id === selectedCallId;
              return (
                <div
                  key={call.id}
                  onClick={() => handleSelectCall(call.id)}
                  className={`p-5 flex items-center justify-between cursor-pointer transition-all duration-150 ${isSelected ? 'bg-slate-50/80 border-l-4 border-black' : 'hover:bg-slate-50/30'
                    }`}
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{call.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold truncate uppercase tracking-wider">
                      {call.campaign}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded">
                      {formatTime(call.timer)}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 ${isSelected ? 'text-black' : ''}`} />
                  </div>
                </div>
              );
            })}

            {calls.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-medium space-y-2">
                <Activity className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs">No active calls in progress at this time.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CALL DETAILS & LIVE TRANSCRIPT */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col min-h-[60vh]">
          {selectedCall ? (
            <>
              {/* Details Pane Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-outfit text-slate-900 leading-tight">
                    {selectedCall.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {selectedCall.phone} <span className="mx-1.5 text-slate-300">•</span> {selectedCall.campaign}
                  </p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setWhisperActive(!whisperActive);
                      if (bargeActive) setBargeActive(false);
                    }}
                    className={`flex items-center text-xs font-bold px-3.5 py-2 border rounded-lg transition-all shadow-2xs ${whisperActive
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <VolumeX className="h-3.5 w-3.5 mr-1.5" /> Whisper
                  </button>
                  <button
                    onClick={() => {
                      setBargeActive(!bargeActive);
                      if (whisperActive) setWhisperActive(false);
                    }}
                    className={`flex items-center text-xs font-bold px-3.5 py-2 border rounded-lg transition-all shadow-2xs ${bargeActive
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <Mic className="h-3.5 w-3.5 mr-1.5" /> Barge in
                  </button>
                  <button
                    onClick={() => handleEndCall(selectedCall.id)}
                    className="flex items-center text-xs font-bold px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-2xs"
                  >
                    <PhoneOff className="h-3.5 w-3.5 mr-1.5" /> End
                  </button>
                </div>
              </div>

              {/* Status Banner when actions are active */}
              {whisperActive && (
                <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100/60 text-[10px] font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Whisper Mode Active — Speak directly to the AI Agent (the prospect won&apos;t hear you)
                </div>
              )}
              {bargeActive && (
                <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100/60 text-[10px] font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  Barge In Active — You are connected live in a 3-way conference call
                </div>
              )}

              {/* Live Transcript Pane bubbles */}
              <div className="p-6 flex-1 bg-slate-50/40 space-y-4 max-h-[50vh] overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col">
                {selectedCall.transcript.map((line, idx) => {
                  const isBot = line.speaker === 'AI AGENT';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col space-y-1.5 max-w-[75%] relative ${
                        isBot 
                          ? 'self-start mr-auto items-start' 
                          : 'self-end ml-auto items-end'
                      }`}
                    >
                      {/* Speaker label with custom status indication */}
                      <div className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-1 ${
                        isBot ? 'text-indigo-600' : 'text-slate-600'
                      }`}>
                        {isBot ? (
                          <>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
                            <Bot className="h-3 w-3" />
                            <span>Real AI Bot</span>
                          </>
                        ) : (
                          <>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
                            <User className="h-3 w-3" />
                            <span>User Answer</span>
                          </>
                        )}
                      </div>

                      {/* Bubble box */}
                      <div className="relative group">
                        <div
                          className={`p-3.5 rounded-2xl text-xs font-semibold shadow-2xs leading-relaxed transition-all duration-200 ${
                            isBot
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tl-none hover:shadow-xs'
                              : 'bg-slate-900 text-white rounded-tr-none hover:shadow-xs border border-slate-800'
                          }`}
                        >
                          {line.text}
                        </div>

                        {/* Special glowing ring for active line */}
                        {line.isSpecial && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        )}

                        {/* Mockup decorations R badge */}
                        {isBot && line.isSpecial && (
                          <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-[#10b981] text-white text-[9px] font-bold shadow-xs select-none">
                            R
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={transcriptEndRef} />
              </div>

              {/* Real-time Bot Speaking indicator bar */}
              {selectedCall.transcript.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Live Status:</span>
                    {selectedCall.transcript[selectedCall.transcript.length - 1].speaker === 'AI AGENT' ? (
                      <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                        <span>Real AI Bot is speaking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>User Answer received</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1 h-3 bg-indigo-500 animate-pulse rounded-xs" />
                    <span className="inline-block w-1 h-4 bg-indigo-400 animate-pulse rounded-xs delay-75" />
                    <span className="inline-block w-1 h-3.5 bg-indigo-600 animate-pulse rounded-xs delay-150" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="m-auto text-center p-12 text-slate-400 font-medium space-y-2">
              <Radio className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs">Select an active call to view live transcript monitoring.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
