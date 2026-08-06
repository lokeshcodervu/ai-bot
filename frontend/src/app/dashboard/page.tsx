'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';
import API_BASE from '../../config/api';
import { 
  Phone, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight, 
  Wallet,
  X
} from 'lucide-react';

const getCampaignStatusStyle = (status: string) => {
  const s = (status || '').toUpperCase();
  if (s === 'RUNNING' || s === 'ACTIVE' || s === 'LIVE') {
    return { statusLabel: 'Live', statusColor: 'bg-[#FFF1F2] text-[#F43F5E] border-[#FECDD3]', barColor: 'bg-[#F43F5E]' };
  }
  if (s === 'COMPLETED') {
    return { statusLabel: 'Completed', statusColor: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]', barColor: 'bg-[#059669]' };
  }
  return { statusLabel: 'Paused', statusColor: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]', barColor: 'bg-[#E5E5E5]' };
};

const getDispositionStyle = (disposition: string) => {
  const disp = (disposition || '').toLowerCase();
  if (disp.includes('converted')) {
    return 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]';
  }
  if (disp.includes('not interested') || disp.includes('failed') || disp.includes('declined')) {
    return 'bg-[#FFF1F2] text-[#F43F5E] border-[#FECDD3]';
  }
  if (disp.includes('follow-up') || disp.includes('followup') || disp.includes('needs follow-up')) {
    return 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]';
  }
  if (disp.includes('connected') || disp.includes('answered')) {
    return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
  }
  return 'text-slate-400 font-medium';
};

const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const formatDuration = (seconds?: number) => {
  if (seconds === undefined || seconds === null) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function DashboardOverview() {
  const router = useRouter();
  const { wallet, setWallet, token, setToken, setUser } = useStore();

  const [showFundsModal, setShowFundsModal] = useState(false);
  const [addAmount, setAddAmount] = useState('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Metrics State
  const [totalCalls, setTotalCalls] = useState<number | null>(null);
  const [connectionRate, setConnectionRate] = useState<number | null>(null);
  const [leadsConverted, setLeadsConverted] = useState<number | null>(null);
  const [costPerConversion, setCostPerConversion] = useState<number | null>(null);

  // Dynamic Lists State
  const [dynamicCampaigns, setDynamicCampaigns] = useState<any[] | null>(null);
  const [dynamicRecentCalls, setDynamicRecentCalls] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        };

        const [walletRes, logsRes, leadsRes, campaignsRes] = await Promise.all([
          fetch(`${API_BASE}/tenant/wallet`, { headers }).catch(() => null),
          fetch(`${API_BASE}/call-logs`, { headers }).catch(() => null),
          fetch(`${API_BASE}/leads`, { headers }).catch(() => null),
          fetch(`${API_BASE}/campaigns`, { headers }).catch(() => null)
        ]);

        if (
          (walletRes && walletRes.status === 401) ||
          (logsRes && logsRes.status === 401) ||
          (leadsRes && leadsRes.status === 401) ||
          (campaignsRes && campaignsRes.status === 401)
        ) {
          setToken(null);
          setUser(null);
          router.push('/');
          return;
        }

        // 1. Wallet Balance
        if (walletRes && walletRes.ok) {
          const walletData = await walletRes.json();
          setWallet({ balance: walletData.balance / 100 });
        }

        const logsData = logsRes && logsRes.ok ? await logsRes.json() : [];
        const leadsData = leadsRes && leadsRes.ok ? await leadsRes.json() : [];
        const campaignsData = campaignsRes && campaignsRes.ok ? await campaignsRes.json() : [];

        // 2. Dynamic Calculated Metrics
        const callCount = logsData.length;
        setTotalCalls(callCount);

        const answered = logsData.filter((log: any) =>
          log.call_disposition === 'Answered' || log.call_disposition === 'Connected' || log.status === 'Completed'
        ).length;
        const rate = callCount > 0 ? Math.round((answered / callCount) * 100) : 0;
        setConnectionRate(rate);

        const convertedCount = leadsData.filter((l: any) => l.status === 'Converted' || l.call_disposition === 'Converted').length;
        setLeadsConverted(convertedCount);

        const costPerConv = convertedCount > 0 ? Math.round((callCount * 142) / (convertedCount || 1)) : 0;
        setCostPerConversion(costPerConv);

        // 3. Dynamic Active Campaigns
        const mappedCampaigns = campaignsData.slice(0, 5).map((camp: any) => {
          const leads = camp.leadsCount || camp.total_leads || (camp.leads ? camp.leads.length : 0);
          const completed = camp.completedCalls || camp.calls_count || 0;
          const progress = leads > 0 ? Math.min(100, Math.round((completed / leads) * 100)) : 0;
          const style = getCampaignStatusStyle(camp.status);
          return {
            name: camp.name,
            leads: leads,
            progress: progress,
            status: style.statusLabel,
            statusColor: style.statusColor,
            barColor: style.barColor
          };
        });
        setDynamicCampaigns(mappedCampaigns);

        // 4. Dynamic Recent Calls
        const mappedCalls = logsData.slice(0, 5).map((log: any) => {
          const lead = leadsData.find((l: any) => l.id === log.lead_id);
          const campaign = campaignsData.find((c: any) => c.id === log.campaign_id);
          const disp = log.call_disposition || log.status || 'Connected';
          return {
            lead: lead?.name || log.lead_name || 'Unknown Lead',
            phone: lead?.phone || log.phone_number || 'N/A',
            campaign: campaign?.name || log.campaign_name || 'General Outreach',
            duration: formatDuration(log.call_duration),
            disposition: disp,
            dispStyle: getDispositionStyle(disp),
            time: formatRelativeTime(log.created_at)
          };
        });
        setDynamicRecentCalls(mappedCalls);

      } catch (err) {
        console.error('Error loading dynamic dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, setToken, setUser, setWallet, router]);

  const handleAddFundsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cents = Math.round(parseFloat(addAmount) * 100);
      if (isNaN(cents) || cents <= 0) {
        alert("Please enter a valid positive amount.");
        setIsSubmitting(false);
        return;
      }
      
      const res = await fetch(`${API_BASE}/tenant/wallet/recharge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ amount: cents })
      });
      
      if (res.ok) {
        const data = await res.json();
        setWallet({ balance: data.balance / 100 });
        setShowFundsModal(false);
        alert(`Successfully added ₹${(data.balance / 100).toFixed(2)} to your wallet!`);
      } else {
        const err = await res.json();
        alert(`Recharge failed: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
      const currentBalance = wallet?.balance || 120.00;
      setWallet({ balance: currentBalance + parseFloat(addAmount) });
      setShowFundsModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4 Top KPI Metrics Cards
  const topMetrics = [
    { 
      name: 'Total Calls Made', 
      value: totalCalls !== null ? totalCalls.toLocaleString() : '0', 
      change: '+12.4% this week',
      isPositive: true,
      icon: Phone,
      isCustomIcon: false
    },
    { 
      name: 'Connection Rate', 
      value: connectionRate !== null ? `${connectionRate}%` : '0%', 
      change: '+3.1% this week',
      isPositive: true,
      icon: TrendingUp,
      isCustomIcon: false
    },
    { 
      name: 'Leads Converted', 
      value: leadsConverted !== null ? leadsConverted.toLocaleString() : '0', 
      change: '-2.8% this week',
      isPositive: false,
      icon: CheckCircle2,
      isCustomIcon: false
    },
    { 
      name: 'Cost per Conversion', 
      value: costPerConversion !== null ? `₹${costPerConversion.toLocaleString()}` : '₹0', 
      change: '+5.8% this week',
      isPositive: true,
      icon: null,
      isCustomIcon: true
    }
  ];

  const activeCampaignsList = dynamicCampaigns || [];
  const recentCallsList = dynamicRecentCalls || [];

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* TOP ROW: 4 KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((m) => {
          const MetricIcon = m.icon;
          return (
            <div 
              key={m.name} 
              className="bg-white p-5 rounded-[8px] border border-[#D4D4D4] flex justify-between items-start transition-all hover:border-slate-400"
            >
              <div className="space-y-2">
                <p className="panel-title text-[#475569]">
                  {m.name}
                </p>

                <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none pt-1">
                  {isLoading ? (
                    <div className="h-8 w-24 bg-slate-200 animate-pulse rounded my-1" />
                  ) : (
                    m.value
                  )}
                </h3>

                <p className={`text-xs font-bold pt-1 ${m.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {m.change}
                </p>
              </div>

              <div className="p-1">
                {m.isCustomIcon ? (
                  <span className="text-xl font-bold font-sans text-slate-400 select-none">₹</span>
                ) : (
                  MetricIcon && <MetricIcon className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MIDDLE ROW: WALLET BALANCE + ACTIVE CAMPAIGNS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wallet Balance Card */}
        <div className="bg-white p-5 rounded-[8px] border border-[#D4D4D4] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="panel-title text-slate-900 font-bold">Wallet Balance</p>
              <Wallet className="h-5 w-5 text-slate-400" />
            </div>

            <div>
              <h3 className="text-3xl font-extrabold font-outfit text-slate-900">
                ₹{(wallet?.balance !== undefined ? wallet.balance : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">of ₹10,000 monthly budget</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-[#E5E5E5] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#ef4444] rounded-full transition-all" 
                  style={{ width: `${Math.min(100, Math.max(5, ((wallet?.balance || 0) / 10000) * 100))}%` }} 
                />
              </div>
              <p className="text-xs font-semibold text-[#ef4444]">Campaigns pause at ₹0</p>
            </div>
          </div>

          <button
            onClick={() => setShowFundsModal(true)}
            className="w-full bg-[#171717] hover:bg-black text-white py-3 rounded-[8px] text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Funds</span>
          </button>
        </div>

        {/* ACTIVE CAMPAIGNS CARD */}
        <div className="bg-white rounded-[8px] border border-[#D4D4D4] lg:col-span-2 flex flex-col justify-between overflow-hidden">
          
          {/* Header Row */}
          <div className="p-5 flex items-center justify-between border-b border-[#E5E5E5]">
            <h3 className="panel-title text-slate-900 font-bold">Active Campaigns</h3>
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="px-4 py-1.5 bg-white border border-[#D4D4D4] hover:bg-slate-50 text-slate-900 font-semibold text-xs rounded-[8px] flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span>View All Campaigns</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Table Body */}
          <div className="px-5 pb-5 overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[#F0F0F0] text-[#737373] font-medium">
                  <th className="py-3.5 font-medium font-outfit">Campaign</th>
                  <th className="py-3.5 font-medium font-outfit px-4">Lead</th>
                  <th className="py-3.5 font-medium font-outfit px-4">Progress</th>
                  <th className="py-3.5 font-medium font-outfit text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n}>
                      <td className="py-4"><div className="h-4 w-32 bg-slate-200 animate-pulse rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-12 bg-slate-200 animate-pulse rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 animate-pulse rounded" /></td>
                      <td className="py-4 text-right"><div className="h-5 w-16 bg-slate-200 animate-pulse rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : activeCampaignsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                      No active campaigns found.
                    </td>
                  </tr>
                ) : (
                  activeCampaignsList.map((camp, idx) => (
                    <tr key={camp.name + idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-900">{camp.name}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700">{camp.leads}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3 min-w-[140px]">
                          <div className="h-1.5 w-28 bg-[#E5E5E5] rounded-full overflow-hidden flex-shrink-0">
                            <div className={`h-full ${camp.barColor} rounded-full`} style={{ width: `${camp.progress}%` }} />
                          </div>
                          <span className="text-slate-600 font-bold text-[11px]">{camp.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-[8px] border text-xs font-semibold ${camp.statusColor}`}>
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RECENT CALLS CARD */}
      <div className="bg-white rounded-[8px] border border-[#D4D4D4] overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-[#E5E5E5]">
          <h3 className="panel-title text-slate-900 font-bold">Recent Calls</h3>
          <button
            onClick={() => router.push('/dashboard/call-logs')}
            className="px-4 py-1.5 bg-white border border-[#D4D4D4] hover:bg-slate-50 text-slate-900 font-semibold text-xs rounded-[8px] flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span>View All Calls</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-[#F0F0F0] text-[#737373] font-medium">
                <th className="py-3 font-medium font-outfit">Lead</th>
                <th className="py-3 font-medium font-outfit px-4">Phone</th>
                <th className="py-3 font-medium font-outfit px-4">Campaign</th>
                <th className="py-3 font-medium font-outfit px-4">Duration</th>
                <th className="py-3 font-medium font-outfit px-4">Disposition</th>
                <th className="py-3 font-medium font-outfit text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((n) => (
                  <tr key={n}>
                    <td className="py-3.5"><div className="h-4 w-24 bg-slate-200 animate-pulse rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-200 animate-pulse rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-200 animate-pulse rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-12 bg-slate-200 animate-pulse rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 w-20 bg-slate-200 animate-pulse rounded" /></td>
                    <td className="py-3.5 text-right"><div className="h-4 w-16 bg-slate-200 animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              ) : recentCallsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                    No recent calls found.
                  </td>
                </tr>
              ) : (
                recentCallsList.map((call, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">{call.lead}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{call.phone}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{call.campaign}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-bold">{call.duration}</td>
                    <td className="py-3.5 px-4">
                      {call.dispStyle.includes('border') ? (
                        <span className={`inline-block px-3 py-1 rounded-[8px] border text-xs font-semibold ${call.dispStyle}`}>
                          {call.disposition}
                        </span>
                      ) : (
                        <span className={`text-xs ${call.dispStyle}`}>
                          {call.disposition}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-slate-400 font-semibold text-right">{call.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FUNDS RECHARGE MODAL DIALOG */}
      {showFundsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-[#D4D4D4] overflow-hidden text-xs transition-all transform scale-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-[#E5E5E5] flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4.5 w-4.5 text-[#111111]" />
                <span className="font-bold text-slate-900 text-sm">Add Funds</span>
              </div>
              <button onClick={() => setShowFundsModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Enter Recharge Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      step="1"
                      min="100"
                      placeholder="1000"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full pl-7 pr-4 py-2 rounded-lg border border-[#D4D4D4] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Recharge amount will be credited to your calling budget immediately.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-[#E5E5E5] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFundsModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#D4D4D4] text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Recharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
