'use client';

import { useState, useEffect } from 'react';
import { Search, PhoneCall, Clock, Info, ShieldAlert, X, Play, Volume2, Sparkles, FileText } from 'lucide-react';
import { useStore } from '../../store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

interface CallLogItem {
  id: string;
  leadName: string;
  phone: string;
  campaign: string;
  duration: string;
  disposition: string;
  time: string;
  recordingUrl?: string;
  aiSummary?: string;
  transcript?: { role: string; content: string }[];
}

export default function CallLogsPage() {
  const { token } = useStore();
  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [displayedLogs, setDisplayedLogs] = useState<CallLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CallLogItem | null>(null);

  const getAudioSource = (url?: string) => {
    if (!url) return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    if (url.includes("s3.amazonaws.com/ai-bot-recordings/")) {
      return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    }
    return url;
  };

  // Fetch Call Logs, Leads, and Campaigns
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        };

        const [logsRes, leadsRes, campaignsRes] = await Promise.all([
          fetch(`${API_BASE}/call-logs`, { headers }),
          fetch(`${API_BASE}/leads`, { headers }),
          fetch(`${API_BASE}/campaigns`, { headers })
        ]);

        if (!logsRes.ok) {
          if (logsRes.status === 402) {
            throw new Error("Subscription payment required to access Call Logs.");
          }
          throw new Error(`Failed to fetch call logs (Status: ${logsRes.status}).`);
        }

        const logsData = await logsRes.json();
        
        let leadsData = [];
        if (leadsRes.ok) {
          leadsData = await leadsRes.json();
        }
        
        let campaignsData = [];
        if (campaignsRes.ok) {
          campaignsData = await campaignsRes.json();
        }

        // Map logs to UI structure
        const mappedLogs = logsData.map((log: any) => {
          const lead = leadsData.find((l: any) => l.id === log.lead_id);
          const campaign = campaignsData.find((c: any) => c.id === log.campaign_id);

          // Convert duration (seconds) to mm:ss
          const mins = Math.floor((log.call_duration || 0) / 60);
          const secs = (log.call_duration || 0) % 60;
          const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

          // Format time ago
          const date = new Date(log.created_at);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          let timeStr = '';
          if (isNaN(date.getTime())) {
            timeStr = 'N/A';
          } else if (diffMins < 1) {
            timeStr = 'Just now';
          } else if (diffMins < 60) {
            timeStr = `${diffMins} min ago`;
          } else {
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) {
              timeStr = `${diffHours} hours ago`;
            } else {
              timeStr = date.toLocaleDateString();
            }
          }

          // Map dispositions
          let disposition = log.call_disposition || 'Connected';
          if (disposition === 'Answered') {
            disposition = 'Connected';
          }

          return {
            id: log.id,
            leadName: lead ? lead.name : 'Unknown Lead',
            phone: lead ? lead.phone : 'N/A',
            campaign: campaign ? campaign.name : 'Direct Call',
            duration: durationStr,
            disposition: disposition,
            time: timeStr,
            recordingUrl: log.recording_url || `https://s3.amazonaws.com/ai-bot-recordings/call_${log.lead_id}.mp3`,
            aiSummary: log.ai_summary || "No summary available for this call.",
            transcript: log.transcript || []
          };
        });

        setLogs(mappedLogs);
      } catch (err: any) {
        console.error("Error loading call logs:", err);
        setError(err.message || "Failed to load call logs.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Filter logs locally based on search query and disposition tag
  useEffect(() => {
    let filtered = logs;

    // Filter by search query (name, campaign, or phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        log =>
          (log.leadName || '').toLowerCase().includes(query) ||
          (log.campaign || '').toLowerCase().includes(query) ||
          (log.phone || '').includes(query)
      );
    }

    // Filter by disposition tag
    if (selectedDisposition !== 'All') {
      filtered = filtered.filter(log => log.disposition === selectedDisposition);
    }

    setDisplayedLogs(filtered);
  }, [searchQuery, selectedDisposition, logs]);

  // Color mapper matching mockup exactly
  const getDispositionColor = (disposition: string) => {
    switch (disposition) {
      case 'Converted':
        return 'text-emerald-600';
      case 'Not Interested':
        return 'text-red-500';
      case 'Needs Follow-up':
        return 'text-amber-500';
      case 'Connected':
        return 'text-indigo-500';
      case 'Busy':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  const filterTags = ['All', 'Converted', 'Not Interested', 'Needs Follow-up', 'Connected', 'Busy'];

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">Call Logs</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">View and audit history of outbound AI phone calls</p>
      </div>

      {/* FILTER & SEARCH CARD CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Controls Row */}
        <div className="p-6 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 border-b border-slate-100">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lead or campaign..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:border-slate-400 focus:bg-white rounded-lg text-sm font-medium transition-all duration-150 outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTags.map((tag) => {
              const isActive = selectedDisposition === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedDisposition(tag)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-2xs border ${
                    isActive 
                      ? 'bg-black border-black text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Lead</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Campaign</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold">Disposition</th>
                <th className="px-6 py-4 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-white">
                    <span className="inline-block animate-pulse">Loading call logs...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500 font-medium bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{log.leadName}</td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">{log.phone}</td>
                  <td className="px-6 py-4 text-slate-600 font-semibold">{log.campaign}</td>
                  <td 
                    onClick={() => setSelectedLog(log)}
                    className="px-6 py-4 text-slate-700 font-bold cursor-pointer hover:text-black hover:underline flex items-center gap-1.5"
                  >
                    <Play className="h-3 w-3 text-slate-400 shrink-0" />
                    {log.duration}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getDispositionColor(log.disposition)}`}>
                    {log.disposition}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-semibold text-right">{log.time}</td>
                </tr>
              ))}

              {!isLoading && !error && displayedLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium bg-white">
                    No call logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORDING & DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <PhoneCall className="h-4.5 w-4.5 text-black" />
                <span className="font-bold text-slate-900 text-sm">Call Recording & Details</span>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedLog.leadName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedLog.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campaign</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedLog.campaign}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                  <p className="font-semibold text-slate-500 mt-0.5">{selectedLog.time}</p>
                </div>
              </div>

              {/* Custom Styled Audio Player */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
                <div className="h-10 w-10 shrink-0 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                  <Volume2 className="h-5 w-5 text-white/80" />
                </div>
                
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
                    <span>Call Recording Playback</span>
                    <a 
                      href={selectedLog.recordingUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-white underline transition-colors"
                    >
                      Download MP3
                    </a>
                  </div>
                  
                  {/* Native HTML5 Audio element with custom wrapper style */}
                  <audio 
                    controls 
                    className="w-full h-9 outline-none bg-transparent"
                    src={getAudioSource(selectedLog.recordingUrl)}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-[9px] text-white/40 italic">Note: Real-time S3 audio playback fallbacks to a sample demo track for testing purposes.</p>
                </div>
              </div>

              {/* AI summary */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-slate-600" /> AI Executive Summary
                </h4>
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl font-medium text-slate-600 leading-relaxed">
                  {selectedLog.aiSummary}
                </div>
              </div>

              {/* Transcript Speech Bubbles */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-600" /> Call Transcript
                </h4>
                
                <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {selectedLog.transcript && selectedLog.transcript.length > 0 ? (
                    selectedLog.transcript.map((bubble: any, i) => {
                      const isUser = bubble.speaker === 'User';
                      return (
                        <div key={i} className={`p-3.5 flex flex-col gap-1 ${isUser ? 'bg-slate-50/50' : 'bg-white'}`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-bold text-[10px] uppercase tracking-wider ${isUser ? 'text-indigo-600' : 'text-slate-950'}`}>
                              {isUser ? 'Prospect' : 'AI Agent'}
                            </span>
                          </div>
                          <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                            {bubble.text}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-slate-400 py-8 font-medium">No transcript available for this call log.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-black hover:bg-[#1f2937] text-white font-bold rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
