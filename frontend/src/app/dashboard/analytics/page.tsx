'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  TrendingDown
} from 'lucide-react';
import { useStore } from '../../store';

import API_BASE from '../../../config/api';

interface CampaignPerformance {
  campaignName: string;
  calls: number;
  conv: number;
  rate: string;
}

interface DispositionShare {
  name: string;
  count: number;
  percentage: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, setToken, setUser } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for calculated stats
  const [totalCalls, setTotalCalls] = useState(0);
  const [connectionRate, setConnectionRate] = useState(0);
  const [leadsConverted, setLeadsConverted] = useState(0);
  const [avgCostPerLead, setAvgCostPerLead] = useState(0);
  const [avgCallDuration, setAvgCallDuration] = useState('0:00');

  const [campaignPerformances, setCampaignPerformances] = useState<CampaignPerformance[]>([]);
  const [dispositions, setDispositions] = useState<DispositionShare[]>([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
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

        if (logsRes.status === 401 || leadsRes.status === 401 || campaignsRes.status === 401) {
          // Token expired, log out
          setToken(null);
          setUser(null);
          router.push('/');
          return;
        }

        if (!logsRes.ok) {
          if (logsRes.status === 402) {
            throw new Error("Subscription payment required to access Analytics.");
          }
          throw new Error(`Failed to fetch call logs (Status: ${logsRes.status}).`);
        }

        const logsData = logsRes.ok ? await logsRes.json() : [];
        const leadsData = leadsRes.ok ? await leadsRes.json() : [];
        const campaignsData = campaignsRes.ok ? await campaignsRes.json() : [];

        // 1. Basic Counts
        const totalCallsCount = logsData.length;
        setTotalCalls(totalCallsCount);

        const answeredCalls = logsData.filter((log: any) => 
          log.call_disposition === 'Answered' || log.call_disposition === 'Connected'
        );
        const answeredCount = answeredCalls.length;
        
        const rate = totalCallsCount > 0 ? Math.round((answeredCount / totalCallsCount) * 100) : 0;
        setConnectionRate(rate);

        const convertedCount = leadsData.filter((l: any) => l.status === 'Converted').length;
        setLeadsConverted(convertedCount);

        // 2. Average Call Duration
        const totalDuration = logsData.reduce((acc: number, log: any) => acc + (log.call_duration || 0), 0);
        const avgDurationSeconds = totalCallsCount > 0 ? Math.round(totalDuration / totalCallsCount) : 0;
        const mins = Math.floor(avgDurationSeconds / 60);
        const secs = avgDurationSeconds % 60;
        setAvgCallDuration(`${mins}:${secs.toString().padStart(2, '0')}`);

        // 3. Avg Cost per Call
        // Let's assume a realistic average call cost rate of ₹12.5 per minute (which is ₹0.208 per second)
        const totalCost = totalDuration * 0.208;
        const avgCost = totalCallsCount > 0 ? Math.round(totalCost / totalCallsCount) : 0;
        setAvgCostPerLead(avgCost);

        // 4. Performance by Campaign
        const campaignsMap: { [key: string]: { name: string; calls: number; conv: number } } = {};
        
        // Initialize with actual campaigns
        campaignsData.forEach((c: any) => {
          campaignsMap[c.id] = { name: c.name, calls: 0, conv: 0 };
        });

        // Group call logs by campaign
        logsData.forEach((log: any) => {
          const campId = log.campaign_id || 'direct';
          const lead = leadsData.find((l: any) => l.id === log.lead_id);
          const isConverted = lead ? lead.status === 'Converted' : false;

          if (!campaignsMap[campId]) {
            campaignsMap[campId] = { 
              name: campId === 'direct' ? 'Direct Calls' : 'Unknown Campaign', 
              calls: 0, 
              conv: 0 
            };
          }
          campaignsMap[campId].calls += 1;
          if (isConverted) {
            campaignsMap[campId].conv += 1;
          }
        });

        const performanceList: CampaignPerformance[] = Object.values(campaignsMap)
          .filter(c => c.calls > 0)
          .map(c => ({
            campaignName: c.name,
            calls: c.calls,
            conv: c.conv,
            rate: c.calls > 0 ? `${((c.conv / c.calls) * 100).toFixed(1)}%` : '0.0%'
          }));
        
        setCampaignPerformances(performanceList);

        // 5. Disposition Shares
        const dispCounts = {
          'Converted': 0,
          'Needs Follow-up': 0,
          'Connected': 0,
          'Not Interested': 0,
          'Busy / No Answer': 0,
        };

        logsData.forEach((log: any) => {
          const lead = leadsData.find((l: any) => l.id === log.lead_id);
          const status = lead ? lead.status : '';
          const disp = log.call_disposition;

          if (status === 'Converted') {
            dispCounts['Converted']++;
          } else if (status === 'Needs Follow-up') {
            dispCounts['Needs Follow-up']++;
          } else if (status === 'Not Interested') {
            dispCounts['Not Interested']++;
          } else if (disp === 'Answered' || disp === 'Connected') {
            dispCounts['Connected']++;
          } else if (disp === 'Busy' || disp === 'No Answer' || disp === 'DND Skip' || disp === 'Failed') {
            dispCounts['Busy / No Answer']++;
          } else {
            dispCounts['Connected']++;
          }
        });

        const shares: DispositionShare[] = Object.entries(dispCounts).map(([name, count]) => ({
          name,
          count,
          percentage: totalCallsCount > 0 ? Math.round((count / totalCallsCount) * 100) : 0
        })).sort((a, b) => b.count - a.count);

        setDispositions(shares);

      } catch (err: any) {
        console.error("Error loading analytics:", err);
        setError(err.message || "Failed to load analytics data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
        <p className="text-sm font-semibold text-slate-500">Loading workspace analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white rounded-2xl border border-red-100 space-y-4 max-w-lg mx-auto">
        <TrendingDown className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-bold text-slate-900">Analytics Unavailable</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Analyze calling outcomes, conversion performance, and costs</p>
      </div>

      {/* TOP ROW: 3 METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Total Calls Made</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              {totalCalls.toLocaleString()}
            </h3>
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-400">
                All campaigns active
              </span>
            </div>
          </div>
          <div className="p-1 text-slate-400">
            <Phone className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Connection Rate</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              {connectionRate}%
            </h3>
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-400">
                Based on answered calls
              </span>
            </div>
          </div>
          <div className="p-1 text-slate-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Leads Converted</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              {leadsConverted.toLocaleString()}
            </h3>
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-400">
                Workspace qualified leads
              </span>
            </div>
          </div>
          <div className="p-1 text-slate-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* SECOND ROW: 2 METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Avg Cost / Call</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              ₹{avgCostPerLead}
            </h3>
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-400">
                Estimated Twilio & LLM spend
              </span>
            </div>
          </div>
          <div className="p-1 text-slate-400 font-bold text-sm">
            <span className="text-lg leading-none font-semibold">₹</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Avg Call Duration</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              {avgCallDuration}
            </h3>
            <div className="pt-1">
              <span className="text-xs font-bold text-slate-400">
                Per connected call duration
              </span>
            </div>
          </div>
          <div className="p-1 text-slate-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Performance by Campaign */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold font-outfit text-slate-900 mb-4">Performance by campaign</h3>
            
            {campaignPerformances.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No campaigns found with logged calls.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 font-bold">Campaign</th>
                      <th className="py-2.5 font-bold">Calls</th>
                      <th className="py-2.5 font-bold">Conv.</th>
                      <th className="py-2.5 font-bold">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {campaignPerformances.map((perf, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/20">
                        <td className="py-4 font-bold text-slate-900">{perf.campaignName}</td>
                        <td className="py-4 text-slate-600 font-semibold">{perf.calls}</td>
                        <td className="py-4 text-slate-600 font-semibold">{perf.conv}</td>
                        <td className="py-4 text-slate-700 font-bold">{perf.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Disposition Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <h3 className="text-base font-bold font-outfit text-slate-900">Disposition breakdown</h3>

          {totalCalls === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No logged calls to show breakdown.</p>
          ) : (
            <div className="space-y-4.5">
              {dispositions.map((disp, idx) => (
                <div key={idx} className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-bold">{disp.name}</span>
                    <span className="text-slate-500 font-semibold">
                      {disp.count} ({disp.percentage}%)
                    </span>
                  </div>
                  {/* Horizontal progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-[#ef4444] rounded-full" 
                      style={{ width: `${disp.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
