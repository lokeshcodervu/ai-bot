'use client';

import { useState } from 'react';
import { useStore } from '../store';
import { 
  Phone, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  X
} from 'lucide-react';

export default function DashboardOverview() {
  const { campaigns, wallet, setWallet, token } = useStore();

  const [showFundsModal, setShowFundsModal] = useState(false);
  const [addAmount, setAddAmount] = useState('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
      
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
      alert("Failed to connect to the server. Added mockup funds locally.");
      // Fallback update local state for presentation if backend connection fails
      const currentBalance = wallet?.balance || 120.00;
      setWallet({ balance: currentBalance + parseFloat(addAmount) });
      setShowFundsModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics matching layout image
  const metrics = [
    { 
      name: 'Total Calls Made', 
      value: '1,284', 
      change: '+12.4% this week', 
      isPositive: true, 
      icon: Phone,
      isCustomIcon: false
    },
    { 
      name: 'Connection Rate', 
      value: '38%', 
      change: '+3.1% this week', 
      isPositive: true, 
      icon: TrendingUp,
      isCustomIcon: false
    },
    { 
      name: 'Leads Converted', 
      value: '94', 
      change: '-2.8% this week', 
      isPositive: false, 
      icon: CheckCircle2,
      isCustomIcon: false
    },
    { 
      name: 'Cost per Conversion', 
      value: '142', 
      isCurrency: true,
      change: '+5.8% this week', 
      isPositive: true, 
      icon: null,
      isCustomIcon: true
    }
  ];

  // Campaigns list dynamically retrieved from store
  const activeCampaigns = campaigns.slice(0, 3).map(c => ({
    name: c.name,
    lead: c.leadsCount,
    progress: c.leadsCount > 0 ? Math.round((c.completedCalls / c.leadsCount) * 100) : 0,
    status: c.status === 'RUNNING' ? 'Live' : c.status === 'COMPLETED' ? 'Completed' : 'Paused',
    color: c.status === 'RUNNING' ? 'bg-[#10b981]' : c.status === 'COMPLETED' ? 'bg-[#f59e0b]' : 'bg-slate-300'
  }));

  // Call Logs matching layout image
  const recentCalls = [
    { lead: 'Aarav Sharma', phone: '+91 9493949393', campaign: 'Q3 React Bootcamp', duration: '3:42', disposition: 'Converted', time: '2 min ago' },
    { lead: 'Priya Iyer', phone: '+91 4857933838', campaign: 'Python Admission', duration: '1:18', disposition: 'Not Interested', time: '8 min ago' },
    { lead: 'Aarav Sharma', phone: '+91 9493949393', campaign: 'Q3 React Bootcamp', duration: '3:42', disposition: 'Needs Follow-up', time: '14 min ago' },
    { lead: 'Priya Iyer', phone: '+91 4857933838', campaign: 'Python Admission', duration: '1:18', disposition: 'Connected', time: '22 min ago' },
    { lead: 'Priya Iyer', phone: '+91 4857933838', campaign: 'Python Admission', duration: '1:18', disposition: 'Busy', time: '31 min ago' }
  ];

  const getDispositionColor = (disp: string) => {
    switch (disp) {
      case 'Converted':
        return 'text-[#10b981]';
      case 'Not Interested':
        return 'text-[#ef4444]';
      case 'Needs Follow-up':
        return 'text-[#f59e0b]';
      case 'Connected':
        return 'text-[#3b82f6]';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 4 METRICS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const MetricIcon = m.icon;
          return (
            <div key={m.name} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">{m.name}</p>
                <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
                  {m.isCurrency && '₹'}{m.value}
                </h3>
                <div className="flex items-center space-x-1 pt-1.5">
                  {m.isPositive ? (
                    <span className="text-xs font-bold text-[#10b981] flex items-center">
                      {m.change}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#ef4444] flex items-center">
                      {m.change}
                    </span>
                  )}
                </div>
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

      {/* BUDGET CARD & ACTIVE CAMPAIGNS split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Calls Made / Budget Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Calls Made</p>
              <h3 className="text-3xl font-extrabold font-outfit text-slate-900 mt-1">₹1,284</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">of ₹10,000 monthly budget</p>
            </div>

            {/* Premium progress bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-[#ef4444] rounded-full" style={{ width: '12.84%' }} />
              </div>
              <p className="text-xs font-semibold text-[#ef4444]">Campaigns pause at ₹0</p>
            </div>
          </div>

          <button
            onClick={() => setShowFundsModal(true)}
            className="w-full bg-[#111111] hover:bg-black text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Funds
          </button>
        </div>

        {/* Active Campaigns Table Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-outfit text-slate-900">Active Campaigns</h3>
            <a href="/dashboard/campaigns" className="text-xs font-bold text-black flex items-center hover:underline gap-0.5">
              View All Logs
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 font-bold">Campaign</th>
                  <th className="py-2.5 font-bold px-4">Lead</th>
                  <th className="py-2.5 font-bold px-4">Progress</th>
                  <th className="py-2.5 font-bold px-4">Status</th>
                  <th className="py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {activeCampaigns.map((camp) => (
                  <tr key={camp.name} className="hover:bg-slate-50/40">
                    <td className="py-4 font-bold text-slate-900">{camp.name}</td>
                    <td className="py-4 px-4 font-semibold text-slate-600">{camp.lead}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3 min-w-[120px]">
                        <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full ${camp.color} rounded-full`} style={{ width: `${camp.progress}%` }} />
                        </div>
                        <span className="text-slate-500 font-bold text-[10px]">{camp.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${camp.status === 'Live' ? 'text-[#10b981]' : camp.status === 'Paused' ? 'text-[#f59e0b]' : 'text-slate-500'}`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <a href={`/dashboard/campaigns?name=${encodeURIComponent(camp.name)}`} className="text-slate-400 hover:text-black font-semibold">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RECENT CALL RECORDS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold font-outfit text-slate-900">Recent Calls</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-3 font-bold">Lead</th>
                <th className="px-6 py-3 font-bold">Phone</th>
                <th className="px-6 py-3 font-bold">Campaign</th>
                <th className="px-6 py-3 font-bold">Duration</th>
                <th className="px-6 py-3 font-bold">Disposition</th>
                <th className="px-6 py-3 font-bold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {recentCalls.map((call, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-950">{call.lead}</td>
                  <td className="px-6 py-3.5 text-slate-600 font-semibold">{call.phone}</td>
                  <td className="px-6 py-3.5 text-slate-600 font-semibold">{call.campaign}</td>
                  <td className="px-6 py-3.5 text-slate-600 font-bold">{call.duration}</td>
                  <td className="px-6 py-3.5 font-bold">
                    <span className={getDispositionColor(call.disposition)}>
                      {call.disposition}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 font-semibold text-right">{call.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <a href="/dashboard" className="text-xs font-bold text-black flex items-center hover:underline gap-0.5">
            View All Logs
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* FUNDS RECHARGE MODAL ON OVERVIEW */}
      {showFundsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs transition-all transform scale-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4.5 w-4.5 text-[#111111]" />
                <span className="font-bold text-slate-900 text-sm">Add Funds</span>
              </div>
              <button onClick={() => setShowFundsModal(false)} className="text-slate-400 hover:text-slate-600">
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
                      className="w-full pl-7 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Recharge amount will be credited to your calling budget immediately.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFundsModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm"
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
