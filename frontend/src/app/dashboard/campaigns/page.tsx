'use client';

import { useState, useEffect } from 'react';
import { useStore, Campaign, Lead } from '../../store';
import { 
  Play, 
  Pause, 
  Plus, 
  X,
  Sliders, 
  Activity, 
  User, 
  ArrowUpRight,
  PhoneCall
} from 'lucide-react';

export default function CampaignsPage() {
  const { campaigns, addCampaign, updateCampaign, leads, updateLeadStatus, tenant } = useStore();
  const isReadOnly = tenant?.verificationStatus !== 'APPROVED';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  
  // Real-time transcript stream mockup
  const [liveTranscript, setLiveTranscript] = useState<{ speaker: string; text: string }[]>([]);
  const [transcriptIndex, setTranscriptIndex] = useState(0);

  // Campaign Form State
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [selectedList, setSelectedList] = useState('All Prospects');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('17:00');
  const [concurrency, setConcurrency] = useState(2);
  const [retries, setRetries] = useState(1);

  // Live Dial Simulator Hook
  useEffect(() => {
    // Check if any campaigns are RUNNING
    const runningCampaign = campaigns.find(c => c.status === 'RUNNING');
    if (!runningCampaign) return;

    // Periodically simulate a call connection
    const interval = setInterval(() => {
      // Find a lead or mock one
      const mockLeads: Lead[] = [
        { id: 'ml-1', name: 'Aarav Sharma', phone: '+91 9493949393', email: 'aarav@example.com', status: 'Pending Queue' },
        { id: 'ml-2', name: 'Priya Iyer', phone: '+91 4857933838', email: 'priya@example.com', status: 'Pending Queue' }
      ];
      const leadList = leads.length > 0 ? leads : mockLeads;
      const nextLead = leadList.find(l => l.status === 'Imported' || l.status === 'Pending Queue' || l.status === 'Connected') || leadList[0];
      
      if (nextLead) {
        // Set lead status to Connected
        if (leads.length > 0) {
          updateLeadStatus(nextLead.id, 'Connected');
        }
        setActiveCallLead(nextLead);
        
        // Start streaming transcript
        setLiveTranscript([
          { speaker: 'AI', text: 'Hello! Thank you for calling. I am your SalesAI coordinator. How can I help you today?' }
        ]);
        setTranscriptIndex(1);
        
        // Update campaign progress
        updateCampaign(runningCampaign.id, { 
          completedCalls: Math.min(runningCampaign.completedCalls + 1, runningCampaign.leadsCount),
          callsCount: (runningCampaign.callsCount || 0) + 1
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [campaigns, leads, updateCampaign, updateLeadStatus]);

  // Transcript animation simulator
  useEffect(() => {
    if (!activeCallLead) return;

    const phrases = [
      { speaker: 'User', text: 'Hi, I was looking for batch timings and enrollment details.' },
      { speaker: 'AI', text: 'Sure! Batch options are available for weekdays and weekend slots. Let me load the fee and syllabus details for you.' },
      { speaker: 'User', text: 'Is there a discount option for early signups?' },
      { speaker: 'AI', text: 'Yes, early bird signups receive a 10% waiver. Would you like me to send you the direct registration link?' },
      { speaker: 'User', text: 'Yes, please email that to me.' },
      { speaker: 'AI', text: 'Perfect! I have sent the registration link to your email. I look forward to having you in the cohort!' }
    ];

    if (transcriptIndex < phrases.length) {
      const timer = setTimeout(() => {
        setLiveTranscript(prev => [...prev, phrases[transcriptIndex]]);
        setTranscriptIndex(prev => prev + 1);
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // End call after conversation completes
      const timer = setTimeout(() => {
        if (activeCallLead) {
          if (leads.length > 0) {
            updateLeadStatus(activeCallLead.id, 'Converted');
          }
          // Increment conversion count on running campaign
          const runningCampaign = campaigns.find(c => c.status === 'RUNNING');
          if (runningCampaign) {
            updateCampaign(runningCampaign.id, {
              convertedCount: (runningCampaign.convertedCount || 0) + 1
            });
          }
          setActiveCallLead(null);
          setLiveTranscript([]);
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeCallLead, transcriptIndex, campaigns, leads, updateCampaign, updateLeadStatus]);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;

    addCampaign({
      id: `c${Date.now()}`,
      name: campaignName,
      status: 'PAUSED',
      description: campaignDescription || 'Custom outbound dialer campaign',
      leadsCount: leads.length > 0 ? leads.length : 120,
      completedCalls: 0,
      concurrencyLimit: concurrency,
      callsCount: 0,
      convertedCount: 0
    });

    setCampaignName('');
    setCampaignDescription('');
    setShowCreateModal(false);
    alert('Campaign created successfully in paused mode!');
  };

  const toggleCampaignStatus = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid card click triggers
    const nextStatus = campaign.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    updateCampaign(campaign.id, { status: nextStatus });
  };

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] border border-[#d1fae5] text-[#10b981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] mr-1.5" />
            Live
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#fef2f2] border border-[#fee2e2] text-[#ef4444]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] mr-1.5" />
            Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#fffbeb] border border-[#fef3c7] text-[#d97706]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d97706] mr-1.5" />
            Paused
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* CAMPAIGNS HEADER */}
      <div className="page-header-card justify-between">
        <h1 className="page-header-title">
          All Campaigns
        </h1>
        
        <button
          onClick={() => {
            if (isReadOnly) {
              alert('Action Disabled: Company verification is currently pending approval.');
              return;
            }
            setShowCreateModal(true);
          }}
          disabled={isReadOnly}
          title={isReadOnly ? 'Action Locked: Verification Pending' : 'Create New Campaign'}
          className={`flex items-center text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs font-outfit ${
            isReadOnly
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-black hover:bg-[#1f2937] text-white cursor-pointer'
          }`}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Campaign
        </button>
      </div>

      {/* ACTIVE CALL MONITORING CONSOLE */}
      {activeCallLead && (
        <div className="bg-blue-50/20 p-5 rounded-2xl border border-blue-100 shadow-xs space-y-4 animate-pulse">
          <div className="flex justify-between items-center border-b border-blue-100/60 pb-3">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[#ef4444] animate-ping" />
              <h3 className="text-xs font-bold text-slate-950 font-outfit uppercase tracking-wider flex items-center">
                <Activity className="h-4.5 w-4.5 text-blue-600 mr-2" /> Live Connection Console
              </h3>
            </div>
            <span className="text-[10px] font-extrabold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#d1fae5]">
              DIALING CONNECTED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-semibold">
            {/* Live Caller details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <User className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{activeCallLead.name}</p>
                  <p className="text-slate-500 font-medium text-[10px]">{activeCallLead.phone}</p>
                </div>
              </div>
            </div>

            {/* scrolling transcripts */}
            <div className="lg:col-span-2 bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[10px] h-28 overflow-y-auto space-y-1.5 flex flex-col justify-end">
              {liveTranscript.map((t, idx) => (
                <div key={idx}>
                  <span className={t.speaker === 'AI' ? 'text-blue-400 font-bold' : 'text-emerald-400 font-bold'}>
                    [{t.speaker}]:
                  </span>{' '}
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGNS CARD GRID OVERHAUL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => {
          const progressPercent = c.leadsCount > 0 ? Math.round((c.completedCalls / c.leadsCount) * 100) : 0;
          return (
            <div 
              key={c.id} 
              className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between space-y-5 hover:shadow-sm transition-all duration-150 relative group"
            >
              {/* Card Header */}
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-900 font-outfit leading-snug group-hover:text-black transition-colors">{c.name}</h3>
                  <div className="flex items-center space-x-2 shrink-0">
                    {getStatusBadge(c.status)}
                    {c.status !== 'COMPLETED' && (
                      <button
                        onClick={(e) => toggleCampaignStatus(c, e)}
                        title={c.status === 'RUNNING' ? 'Pause Campaign' : 'Start Campaign'}
                        className={`p-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                          c.status === 'RUNNING'
                            ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {c.status === 'RUNNING' ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium">{c.description || 'No description available'}</p>
              </div>

              {/* Progress bar matching design */}
              <div className="space-y-1 pt-1">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#f97316] rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>

              {/* Campaign Statistics columns */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100/80 pt-4 text-center">
                <div>
                  <p className="text-lg font-extrabold text-slate-900 leading-tight">{c.leadsCount}</p>
                  <p className="text-[10px] font-bold text-[#10b981] uppercase mt-0.5">Leads</p>
                </div>
                <div className="border-x border-slate-100">
                  <p className="text-lg font-extrabold text-slate-900 leading-tight">{c.callsCount || 0}</p>
                  <p className="text-[10px] font-bold text-[#10b981] uppercase mt-0.5">Calls</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 leading-tight">{c.convertedCount || 0}</p>
                  <p className="text-[10px] font-bold text-[#10b981] uppercase mt-0.5">Converted</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW CAMPAIGN WIZARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Sliders className="h-4.5 w-4.5 text-[#111111]" />
                <span className="font-bold text-slate-900 text-sm">Create New Campaign</span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Mern Stack Cohort"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Campaign Description</label>
                  <input
                    type="text"
                    required
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="e.g. Drive enrolments for Q4 batch"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Start Hour</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">End Hour</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Concurrency Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={concurrency}
                      onChange={(e) => setConcurrency(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Max Retry Limits</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={retries}
                      onChange={(e) => setRetries(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Lead Segment List</label>
                  <select
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none text-slate-800 font-bold"
                  >
                    <option value="All Prospects">All CRM prospects ({leads.length > 0 ? leads.length : 120} leads)</option>
                    <option value="Imported Only">Imported leads only ({leads.filter(l => l.status === 'Imported').length} leads)</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111111] hover:bg-black text-white rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
