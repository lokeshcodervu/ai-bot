'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Phone,
  TrendingUp,
  CheckCircle2,
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
  color: string;
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
          log.call_disposition === 'Answered' || log.call_disposition === 'Connected' || log.status === 'Completed'
        );
        const answeredCount = answeredCalls.length;

        const rate = totalCallsCount > 0 ? Math.round((answeredCount / totalCallsCount) * 100) : 0;
        setConnectionRate(rate);

        const convertedCount = leadsData.filter((l: any) => l.status === 'Converted' || l.call_disposition === 'Converted').length;
        setLeadsConverted(convertedCount);

        // 2. Average Call Duration
        const totalDuration = logsData.reduce((acc: number, log: any) => acc + (log.call_duration || 0), 0);
        const avgDurationSeconds = totalCallsCount > 0 ? Math.round(totalDuration / totalCallsCount) : 0;
        const mins = Math.floor(avgDurationSeconds / 60);
        const secs = avgDurationSeconds % 60;
        setAvgCallDuration(`${mins}:${secs.toString().padStart(2, '0')}`);

        // 3. Avg Cost per Call/Lead
        const avgCost = totalCallsCount > 0 ? Math.round((totalDuration * 0.208) / totalCallsCount) : 0;
        setAvgCostPerLead(avgCost);

        // 4. Performance by Campaign
        let performanceList: CampaignPerformance[] = [];
        if (campaignsData.length > 0) {
          performanceList = campaignsData.map((c: any) => {
            const campLogs = logsData.filter((log: any) => log.campaign_id === c.id);
            const callsCount = campLogs.length;
            const convCount = campLogs.filter((log: any) => {
              const lead = leadsData.find((l: any) => l.id === log.lead_id);
              return lead?.status === 'Converted' || log.call_disposition === 'Converted';
            }).length;

            return {
              campaignName: c.name,
              calls: callsCount,
              conv: convCount,
              rate: callsCount > 0 ? `${((convCount / callsCount) * 100).toFixed(1)}%` : '0.0%'
            };
          });
        }
        setCampaignPerformances(performanceList);

        // 5. Disposition Shares
        const dispCounts: { [key: string]: number } = {
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

          if (status === 'Converted' || disp === 'Converted') {
            dispCounts['Converted']++;
          } else if (status === 'Needs Follow-up' || disp === 'Needs Follow-up') {
            dispCounts['Needs Follow-up']++;
          } else if (status === 'Not Interested' || disp === 'Not Interested') {
            dispCounts['Not Interested']++;
          } else if (disp === 'Answered' || disp === 'Connected') {
            dispCounts['Connected']++;
          } else if (disp === 'Busy' || disp === 'No Answer' || disp === 'DND Skip' || disp === 'Failed') {
            dispCounts['Busy / No Answer']++;
          } else {
            dispCounts['Connected']++;
          }
        });

        const totalDispSum = Object.values(dispCounts).reduce((a, b) => a + b, 0);

        const colorMap: { [key: string]: string } = {
          'Converted': '#059669',
          'Needs Follow-up': '#EA580C',
          'Connected': '#2563EB',
          'Not Interested': '#DC2626',
          'Busy / No Answer': '#64748B',
        };

        const shares: DispositionShare[] = Object.entries(dispCounts).map(([name, count]) => ({
          name,
          count,
          percentage: totalDispSum > 0 ? Math.round((count / totalDispSum) * 100) : 0,
          color: colorMap[name] || '#64748B'
        }));

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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-outfit">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
        <p className="text-sm font-normal text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-white rounded-xl border border-red-100 space-y-4 max-w-lg mx-auto font-outfit">
        <TrendingDown className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-normal text-slate-900">Analytics Unavailable</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit">

      {/* 1. PAGE HEADER CARD */}
      <div className="page-header-card">
        <h1 className="page-header-title">
          Analytics
        </h1>
      </div>

      {/* 2. ROW 1 METRICS CARDS (Flex Layout Matching Figma Width Ratios) */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Total Calls Made (Wider Box ~48%) */}
        <div className="flex-[2.2] table-card-box p-6 flex justify-between items-start">
          <div className="space-y-2">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A] whitespace-nowrap">Total Calls Made</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              {totalCalls.toLocaleString()}
            </h3>
            <p className="text-xs font-normal font-outfit text-[#059669]">
              +12.4% this week
            </p>
          </div>
          <div className="text-slate-400 pt-1">
            <Phone className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>

        {/* Connection Rate (~26%) */}
        <div className="flex-1 table-card-box p-6 flex justify-between items-start min-w-[200px]">
          <div className="space-y-2">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A] whitespace-nowrap">Connection Rate</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              {connectionRate}%
            </h3>
            <p className="text-xs font-normal font-outfit text-[#059669]">
              +3.1% this week
            </p>
          </div>
          <div className="text-slate-400 pt-1">
            <TrendingUp className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>

        {/* Leads Converted (~26%) */}
        <div className="flex-1 table-card-box p-6 flex justify-between items-start min-w-[200px]">
          <div className="space-y-2">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A] whitespace-nowrap">Leads Converted</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              {leadsConverted.toLocaleString()}
            </h3>
            <p className="text-xs font-normal font-outfit text-[#E63946]">
              -2.8% this week
            </p>
          </div>
          <div className="text-slate-400 pt-1">
            <CheckCircle2 className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* 3. ROW 2 METRICS CARDS (Flex Layout Matching Figma Width Ratios) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avg Cost / Lead (~35%) */}
        <div className="flex-1 table-card-box p-6 flex justify-between items-start min-w-[250px]">
          <div className="space-y-2">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A] whitespace-nowrap">Avg Cost / Lead</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              ₹{avgCostPerLead}
            </h3>
            <p className="text-xs font-normal font-outfit text-[#059669]">
              +5.8% this week
            </p>
          </div>
          <div className="text-slate-400 pt-1 font-normal text-lg">
            ₹
          </div>
        </div>

        {/* Avg Call Duration (~65%) */}
        <div className="flex-[2] table-card-box p-6 flex justify-between items-start">
          <div className="space-y-2">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A] whitespace-nowrap">Avg Call Duration</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              {avgCallDuration}
            </h3>
            <p className="text-xs font-normal font-outfit text-[#059669]">
              +5.8% this week
            </p>
          </div>
          <div className="text-slate-400 pt-1">
            <CheckCircle2 className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* 4. TWO COLUMN SECTION: PERFORMANCE TABLE & DISPOSITION BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Performance by Campaign (7 cols) */}
        <div className="lg:col-span-7 table-card-box overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E5]">
            <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
              Performance by campaign
            </h3>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header-row">
                  <th className="table-th">Campaign</th>
                  <th className="table-th">Calls</th>
                  <th className="table-th">Conv.</th>
                  <th className="table-th">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {campaignPerformances.map((perf, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="table-td">{perf.campaignName}</td>
                    <td className="table-td">{perf.calls}</td>
                    <td className="table-td">{perf.conv}</td>
                    <td className="table-td">{perf.rate}</td>
                  </tr>
                ))}
                {campaignPerformances.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm font-outfit">
                      No campaign data found. Create a campaign to start tracking metrics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Disposition Breakdown (5 cols) */}
        <div className="lg:col-span-5 table-card-box overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E5]">
            <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
              Disposition breakdown
            </h3>
          </div>

          <div className="divide-y divide-[#F4F4F5]">
            {dispositions.map((disp, idx) => (
              <div key={idx} className="py-4 px-6 space-y-2 font-outfit">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-normal text-[#0A0A0A]">{disp.name}</span>
                  <span className="font-normal text-[#0A0A0A]">
                    {disp.count} ({disp.percentage}%)
                  </span>
                </div>
                {/* Horizontal Progress Bar matching Figma */}
                <div className="h-2 w-full bg-[#E5E5E5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${disp.percentage}%`,
                      backgroundColor: disp.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
