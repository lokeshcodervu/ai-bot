'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Play, Sparkles, ArrowLeft, Download } from 'lucide-react';
import { useStore } from '../../store';
import API_BASE from '../../../config/api';

interface CallLogItem {
  id: string;
  leadName: string;
  phone: string;
  campaign: string;
  duration: string;
  disposition: string;
  date: string;
  time: string;
  recordingUrl?: string;
  aiSummary?: string;
  transcript?: { speaker: string; text: string }[];
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

          // Format date and time separately
          const dateObj = new Date(log.created_at);
          let dateStr = 'N/A';
          let timeStr = 'N/A';

          if (!isNaN(dateObj.getTime())) {
            const day = dateObj.getDate().toString().padStart(2, '0');
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const year = dateObj.getFullYear();
            dateStr = `${day}/${month}/${year}`;

            let hours = dateObj.getHours();
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            timeStr = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
          }

          // Map dispositions based on lead status, intent tag, or stored call disposition
          let disposition = log.call_disposition || 'Connected';
          if (lead?.status === 'Not Interested' || log.intent_tag === 'Not Interested' || disposition === 'Not Interested') {
            disposition = 'Not Interested';
          } else if (lead?.status === 'Converted' || log.intent_tag === 'Warm Lead' || disposition === 'Converted') {
            disposition = 'Converted';
          } else if (lead?.status === 'Needs Follow-up' || log.intent_tag === 'Call Later' || disposition === 'Needs Follow-up') {
            disposition = 'Needs Follow-up';
          } else if (lead?.status === 'Busy' || disposition === 'Busy') {
            disposition = 'Busy';
          } else if (disposition === 'Answered') {
            disposition = 'Connected';
          }

          return {
            id: log.id,
            leadName: lead ? lead.name : 'Unknown Lead',
            phone: lead ? lead.phone : 'N/A',
            campaign: campaign ? campaign.name : 'Direct Call',
            duration: durationStr,
            disposition: disposition,
            date: dateStr,
            time: timeStr,
            recordingUrl: log.recording_url || `https://s3.amazonaws.com/ai-bot-recordings/call_${log.lead_id}.mp3`,
            aiSummary: log.ai_summary || "Lead confirmed interest in the React bootcamp. Booked demo for Aug 12, 4 PM IST. Wants EMI option.",
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

  // Render Disposition Pill matching Frame 281 Specs
  const getDispositionBadge = (disposition: string) => {
    switch (disposition) {
      case 'Converted':
        return <span className="status-badge status-badge-converted">Converted</span>;
      case 'Not Interested':
        return <span className="status-badge status-badge-not-interested">Not Interested</span>;
      case 'Needs Follow-up':
        return <span className="status-badge status-badge-needs-followup">Needs Follow-up</span>;
      case 'Connected':
        return <span className="status-badge status-badge-connected">Connected</span>;
      case 'Busy':
        return <span className="status-badge status-badge-busy">Busy</span>;
      default:
        return <span className="status-badge status-badge-busy">{disposition}</span>;
    }
  };

  const filterTags = ['All', 'Converted', 'Not Interested', 'Needs Follow-up', 'Connected', 'Busy'];

  // RECORDING & CALL DETAIL FULL PAGE VIEW (Matching Figma Image 2)
  if (selectedLog) {
    return (
      <div className="space-y-6 text-slate-800 animate-fade-in font-outfit">
        {/* BACK TO LIST BUTTON */}
        <div>
          <button
            onClick={() => setSelectedLog(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E4E7] hover:bg-slate-50 text-slate-700 text-xs font-normal rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Back to list
          </button>
        </div>

        {/* 2-COLUMN MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT COLUMN (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: AUDIO PLAYER & RECORDING BOX */}
            <div className="table-card-box p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
                    {selectedLog.leadName} Recording
                  </h2>
                  <p className="font-outfit text-xs font-normal text-slate-400 mt-1">
                    {selectedLog.date} at {selectedLog.time} · {selectedLog.duration}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const audioEl = document.getElementById('log-audio-player') as HTMLAudioElement;
                      if (audioEl) {
                        if (audioEl.paused) audioEl.play();
                        else audioEl.pause();
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-normal rounded-lg transition-all shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Play
                  </button>
                  <a
                    href={selectedLog.recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white border border-[#E4E4E7] hover:bg-slate-50 text-slate-700 rounded-lg transition-all shadow-2xs"
                    title="Download MP3"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                  </a>
                </div>
              </div>

              {/* Native Audio Element */}
              <div className="pt-2">
                <audio
                  id="log-audio-player"
                  controls
                  className="w-full h-10 outline-none"
                  src={getAudioSource(selectedLog.recordingUrl)}
                />
              </div>
            </div>

            {/* CARD 2: TRANSCRIPT BOX */}
            <div className="table-card-box p-6 space-y-4">
              <h3 className="font-outfit font-normal text-[18px] leading-[26px] text-[#0A0A0A] border-b border-[#E5E5E5] pb-3">
                Transcript
              </h3>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedLog.transcript && selectedLog.transcript.length > 0 ? (
                  selectedLog.transcript.map((bubble: any, i: number) => {
                    const isUser = bubble.speaker === 'User' || bubble.speaker === 'Prospect';
                    const timestamp = `00:${(i * 6).toString().padStart(2, '0')}`;
                    return (
                      <div key={i} className="flex gap-4 items-start border-b border-[#F4F4F5] pb-3.5 last:border-0">
                        <span className="text-xs font-normal font-outfit text-slate-400 w-12 shrink-0 pt-0.5">
                          {timestamp}
                        </span>
                        <div className="flex-1 space-y-1">
                          <p className={`text-xs font-normal font-outfit ${isUser ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {isUser ? selectedLog.leadName : 'AI Agent'}
                          </p>
                          <p className="text-sm font-normal font-outfit text-[#09090B] leading-relaxed">
                            {bubble.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start border-b border-[#F4F4F5] pb-3.5">
                      <span className="text-xs font-normal font-outfit text-slate-400 w-12 shrink-0 pt-0.5">00:00</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-normal font-outfit text-slate-500">AI Agent</p>
                        <p className="text-sm font-normal font-outfit text-[#09090B]">
                          Hi {selectedLog.leadName}, this is Neha from CoderVu. Is this a good time to talk about the React bootcamp you enquired about?
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start border-b border-[#F4F4F5] pb-3.5">
                      <span className="text-xs font-normal font-outfit text-slate-400 w-12 shrink-0 pt-0.5">00:06</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-normal font-outfit text-indigo-600">{selectedLog.leadName}</p>
                        <p className="text-sm font-normal font-outfit text-[#09090B]">
                          Yes, please go ahead.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start border-b border-[#F4F4F5] pb-3.5">
                      <span className="text-xs font-normal font-outfit text-slate-400 w-12 shrink-0 pt-0.5">00:10</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-normal font-outfit text-slate-500">AI Agent</p>
                        <p className="text-sm font-normal font-outfit text-[#09090B]">
                          Great. Our Sep cohort runs for 12 weeks, fully placement-assisted. Would you like a quick demo this week?
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start border-b border-[#F4F4F5] pb-3.5">
                      <span className="text-xs font-normal font-outfit text-slate-400 w-12 shrink-0 pt-0.5">00:25</span>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-normal font-outfit text-indigo-600">{selectedLog.leadName}</p>
                        <p className="text-sm font-normal font-outfit text-[#09090B]">
                          Sure, Tuesday works for me.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (4 COLS) */}
          <div className="lg:col-span-4 space-y-6">

            {/* CARD 1: AI SUMMARY BOX */}
            <div className="table-card-box p-6 space-y-4">
              <h3 className="font-outfit font-semibold text-[18px] leading-[26px] text-[#0A0A0A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A0A0A]" />
                AI Summary
              </h3>
              <p className="text-xs font-normal font-outfit text-slate-600 leading-relaxed">
                {selectedLog.aiSummary || "Lead confirmed interest in the React bootcamp. Booked demo for Aug 12, 4 PM IST. Wants EMI option."}
              </p>

              <div className="pt-3 border-t border-[#F4F4F5] space-y-1">
                <h4 className="text-sm font-semibold font-outfit text-[#0A0A0A]">Next action</h4>
                <p className="text-xs font-normal font-outfit text-slate-600">
                  Send EMI breakup + calendar invite
                </p>
              </div>
            </div>

            {/* CARD 2: CALL META DETAILS BOX */}
            <div className="table-card-box p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#F4F4F5]">
                <span className="text-sm font-semibold font-outfit text-[#0A0A0A]">Disposition</span>
                <div>{getDispositionBadge(selectedLog.disposition)}</div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[#F4F4F5]">
                <span className="text-sm font-semibold font-outfit text-[#0A0A0A]">Sentiment</span>
                <span className="font-outfit font-normal text-[16px] leading-[24px] text-[#059669]">Positive</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-[#F4F4F5]">
                <span className="text-sm font-semibold font-outfit text-[#0A0A0A]">Campaign</span>
                <span className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B]">{selectedLog.campaign}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold font-outfit text-[#0A0A0A]">Intent tags</span>
                <div className="flex gap-2 flex-wrap justify-end">
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-[#09090B] font-outfit font-normal text-[16px] leading-[24px] rounded-lg">
                    interested
                  </span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-[#09090B] font-outfit font-normal text-[16px] leading-[24px] rounded-lg">
                    demo-booked
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // MAIN CALL LOGS LIST VIEW
  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit">
      
      {/* BOX 1: CALL LOGS HEADER BOX */}
      <div className="page-header-card">
        <h1 className="page-header-title">
          Call logs
        </h1>
      </div>

      {/* BOX 2: SEARCH BAR & DISPOSITION FILTER BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#94A3B8]" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead or campaign..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E4E4E7] rounded-lg text-sm text-[#09090B] font-outfit placeholder:text-[#94A3B8] focus:outline-none focus:border-slate-400 transition-all"
          />
        </div>

        {/* Disposition Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {filterTags.map((tag) => {
            const isActive = selectedDisposition === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedDisposition(tag)}
                className={`h-[36px] px-[12px] py-[6px] rounded-[8px] border-[0.5px] font-outfit font-normal text-[16px] leading-[24px] tracking-normal transition-all cursor-pointer flex items-center justify-center ${
                  isActive 
                    ? 'bg-[#18181B] border-[#18181B] text-white shadow-2xs' 
                    : 'bg-white border-[#D4D4D4] hover:bg-slate-50 text-[#6D8A96]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOX 3: CALL LOGS LIST TABLE CARD */}
      <div className="table-container">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-th">Lead</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Campaign</th>
                <th className="table-th">Duration</th>
                <th className="table-th">Disposition</th>
                <th className="table-th">Date</th>
                <th className="table-th">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal font-outfit">
                    <span className="inline-block animate-pulse">Loading call logs...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-normal font-outfit">
                    <div className="flex items-center justify-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      <span>{error}</span>
                    </div>
                  </td>
                </tr>
              ) : displayedLogs.map((log) => (
                <tr key={log.id} className="table-row">
                  <td className="table-td">
                    {log.leadName}
                  </td>
                  <td className="table-td">
                    {log.phone}
                  </td>
                  <td className="table-td">
                    {log.campaign}
                  </td>
                  <td 
                    onClick={() => setSelectedLog(log)}
                    className="table-td cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{log.duration}</span>
                    </div>
                  </td>
                  <td className="table-td">
                    {getDispositionBadge(log.disposition)}
                  </td>
                  <td className="table-td">
                    {log.date}
                  </td>
                  <td className="table-td">
                    {log.time}
                  </td>
                </tr>
              ))}

              {!isLoading && !error && displayedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-normal font-outfit">
                    No call logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
