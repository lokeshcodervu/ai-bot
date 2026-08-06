'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import API_BASE from '../../../config/api';
import { 
  EyeOff, 
  FileCheck, 
  Upload, 
  ShieldAlert, 
  X 
} from 'lucide-react';

interface DndEntry {
  id: string;
  phone: string;
  added: string;
  reason: string;
}

interface AuditLog {
  id: string;
  title: string;
  user: string;
  time: string;
}

export default function CompliancePage() {
  const router = useRouter();
  const { user, token, setToken, setUser } = useStore();
  
  const [dndList, setDndList] = useState<DndEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Metrics States
  const [connectionRate, setConnectionRate] = useState<number>(38);
  const [leadsConverted, setLeadsConverted] = useState<number>(94);
  
  // Modal toggle state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add DND form states
  const [dndForm, setDndForm] = useState({ phone: '', reason: 'Manual' });

  // Fetch Blacklist DND entries and live metrics from backend APIs
  useEffect(() => {
    const fetchComplianceData = async () => {
      if (!token) return;
      setIsLoading(true);

      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        };

        const [blacklistRes, logsRes, leadsRes] = await Promise.all([
          fetch(`${API_BASE}/campaigns/blacklist`, { headers }).catch(() => null),
          fetch(`${API_BASE}/call-logs`, { headers }).catch(() => null),
          fetch(`${API_BASE}/leads`, { headers }).catch(() => null)
        ]);

        if (
          (blacklistRes && blacklistRes.status === 401) ||
          (logsRes && logsRes.status === 401) ||
          (leadsRes && leadsRes.status === 401)
        ) {
          setToken(null);
          setUser(null);
          router.push('/');
          return;
        }

        // 1. Blacklist DND Entries
        if (blacklistRes && blacklistRes.ok) {
          const blacklistData = await blacklistRes.json();
          const mappedDnd = blacklistData.map((item: any) => {
            const dateObj = new Date(item.created_at);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toISOString().split('T')[0]
              : '2026-06-20';
            return {
              id: item.id,
              phone: item.phone,
              added: dateStr,
              reason: item.reason || 'Manual'
            };
          });
          setDndList(mappedDnd);
        }

        // 2. Metrics calculation
        const logsData = logsRes && logsRes.ok ? await logsRes.json() : [];
        const leadsData = leadsRes && leadsRes.ok ? await leadsRes.json() : [];

        if (logsData.length > 0) {
          const answered = logsData.filter((log: any) =>
            log.call_disposition === 'Answered' || log.call_disposition === 'Connected' || log.status === 'Completed'
          ).length;
          const rate = Math.round((answered / logsData.length) * 100);
          setConnectionRate(rate);
        }

        if (leadsData.length > 0) {
          const convertedCount = leadsData.filter((l: any) => l.status === 'Converted' || l.call_disposition === 'Converted').length;
          setLeadsConverted(convertedCount);
        }

        // 3. Initial Audit Logs
        setAuditLogs([
          { id: 'audit-1', title: 'System Compliance Policy Active', user: 'System', time: '10 min ago' },
          { id: 'audit-2', title: 'DND Blacklist Repository Verified', user: user?.full_name || 'Admin', time: '15 min ago' }
        ]);

      } catch (err) {
        console.error("Error fetching compliance data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplianceData();
  }, [token, setToken, setUser, router, user?.full_name]);

  // Add DND item via POST /campaigns/blacklist API
  const handleAddDnd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dndForm.phone.trim()) {
      alert('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/campaigns/blacklist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          phone: dndForm.phone,
          reason: dndForm.reason
        })
      });

      if (res.ok) {
        const data = await res.json();
        const today = new Date().toISOString().split('T')[0];
        const newEntry: DndEntry = {
          id: data.id || `dnd-${Date.now()}`,
          phone: data.phone || dndForm.phone,
          added: today,
          reason: data.reason || dndForm.reason
        };

        setDndList(prev => [newEntry, ...prev]);

        const newAudit: AuditLog = {
          id: `audit-${Date.now()}`,
          title: `Added ${dndForm.phone} to Do Not Disturb (DND) list`,
          user: user?.full_name || user?.username || 'Admin',
          time: 'Just now'
        };
        setAuditLogs(prev => [newAudit, ...prev]);

        setDndForm({ phone: '', reason: 'Manual' });
        setShowUploadModal(false);
        alert(`Successfully added ${dndForm.phone} to DND list!`);
      } else {
        const err = await res.json();
        alert(`Failed to add DND entry: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      alert('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fade-in font-outfit">
      
      {/* 1. HEADER TITLE CARD */}
      <div className="page-header-card">
        <h1 className="page-header-title">
          Compilance
        </h1>
      </div>

      {/* 2. TOP ROW STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: DND Entries */}
        <div className="table-card-box p-5 flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">DND entries</h4>
            <h3 className="text-[30px] leading-[38px] font-normal font-outfit text-[#0A0A0A]">
              {isLoading ? (
                <span className="inline-block h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                dndList.length
              )}
            </h3>
          </div>
          <div className="text-slate-400 pt-1">
            <EyeOff className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 2: Connection Rate */}
        <div className="table-card-box p-5 flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">Connection Rate</h4>
            <h3 className="text-[30px] leading-[38px] font-normal font-outfit text-[#0A0A0A]">
              {isLoading ? (
                <span className="inline-block h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                `${connectionRate}%`
              )}
            </h3>
          </div>
          <div className="text-slate-400 pt-1">
            <FileCheck className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>

        {/* Card 3: Leads Converted */}
        <div className="table-card-box p-5 flex justify-between items-start">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">Leads Converted</h4>
            <h3 className="text-[30px] leading-[38px] font-normal font-outfit text-[#0A0A0A]">
              {isLoading ? (
                <span className="inline-block h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                leadsConverted
              )}
            </h3>
          </div>
          <div className="text-slate-400 pt-1">
            <FileCheck className="h-5 w-5 text-slate-400 stroke-[1.5]" />
          </div>
        </div>

      </div>

      {/* 3. DND LIST TABLE CONTAINER */}
      <div className="table-container">
        <div className="p-4 sm:p-5 flex justify-between items-center border-b border-[#E5E5E5]">
          <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
            Do Not Disturb (DND) list
          </h3>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E4E7] hover:bg-slate-50 text-slate-700 text-xs font-normal font-outfit rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4 text-slate-600" />
            Upload list
          </button>
        </div>

        {/* DND List Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D4D4D4] h-[48px] bg-white">
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Phone</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Added</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                    Loading DND entries...
                  </td>
                </tr>
              ) : dndList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No DND entries found. Click Upload list to add numbers.
                  </td>
                </tr>
              ) : (
                dndList.map((entry) => (
                  <tr key={entry.id} className="h-[52px] hover:bg-slate-50/50 transition-colors">
                    <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.phone}</td>
                    <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.added}</td>
                    <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. AUDIT LOG CONTAINER */}
      <div className="table-container">
        <div className="p-4 sm:p-5 border-b border-[#E5E5E5]">
          <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
            Audit log
          </h3>
        </div>

        <div className="divide-y divide-[#E5E5E5]">
          {auditLogs.map((log) => (
            <div key={log.id} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
              <div className="space-y-0.5">
                <p className="font-outfit font-normal text-[16px] leading-[24px] text-[#0A0A0A]">{log.title}</p>
                <p className="font-outfit font-normal text-xs text-[#71717A]">{log.user}</p>
              </div>
              <span className="font-outfit font-normal text-xs text-[#71717A] shrink-0 pl-4">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UPLOAD & MANUAL ADD DND MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-outfit">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-lg border border-[#E5E5E5] overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-[#E5E5E5] flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 text-black" />
                <span className="font-semibold text-slate-900 text-sm">Upload Blacklist Entry</span>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDnd}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-normal text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 99887 76655"
                    value={dndForm.phone}
                    onChange={(e) => setDndForm({ ...dndForm, phone: e.target.value.replace(/[^\d+]/g, '') })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E4E4E7] focus:outline-none focus:border-slate-400 text-sm font-normal font-outfit"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-slate-500 uppercase mb-1">Opt-out Reason</label>
                  <select
                    value={dndForm.reason}
                    onChange={(e) => setDndForm({ ...dndForm, reason: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4E4E7] font-normal font-outfit focus:outline-none text-slate-800 text-xs bg-white cursor-pointer"
                  >
                    <option value="Manual Entry">Manual Entry</option>
                    <option value="Opt-out via Call">Opt-out via Call</option>
                    <option value="Opt-out via SMS">Opt-out via SMS</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-[#E5E5E5] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-white border border-[#E4E4E7] text-slate-700 rounded-lg font-normal hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#18181B] hover:bg-black text-white rounded-lg font-normal transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Number'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

