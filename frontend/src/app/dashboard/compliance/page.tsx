'use client';

import { useState } from 'react';
import { useStore } from '../../store';
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
  reason: 'Opt-out via call' | 'Manual' | 'Opt-out via SMS';
}

interface AuditLog {
  id: string;
  title: string;
  user: string;
  time: string;
}

const INITIAL_DND: DndEntry[] = [
  { id: 'dnd-1', phone: '+91 98123 45678', added: '2026-06-20', reason: 'Opt-out via call' },
  { id: 'dnd-2', phone: '+91 99873 21090', added: '2026-06-22', reason: 'Manual' },
];

const INITIAL_AUDITS: AuditLog[] = [
  { id: 'audit-1', title: 'Updated system prompt v3', user: 'Rahul Agarwal', time: '10 min ago' },
  { id: 'audit-2', title: 'Launched campaign Q3 React Bootcamp', user: 'Sneha Kulkarni', time: '10 min ago' },
  { id: 'audit-3', title: 'Imported 142 leads (csv)', user: 'Vikram Singh', time: '10 min ago' },
  { id: 'audit-4', title: 'Auto-paused Data Science Outreach (low balance)', user: 'System', time: '10 min ago' },
];

export default function CompliancePage() {
  const { user } = useStore();
  const [dndList, setDndList] = useState<DndEntry[]>(INITIAL_DND);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDITS);
  
  // Modal toggle state
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Add DND form states
  const [dndForm, setDndForm] = useState({ phone: '', reason: 'Manual' as DndEntry['reason'] });

  // Add DND item
  const handleAddDnd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dndForm.phone.trim()) {
      alert('Please enter a valid phone number.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newEntry: DndEntry = {
      id: `dnd-${Date.now()}`,
      phone: dndForm.phone,
      added: today,
      reason: dndForm.reason
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
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fade-in font-outfit">
      
      {/* 1. HEADER TITLE CARD (Matching Figma Frame Header) */}
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
              {dndList.length}
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
              38%
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
              94
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
              {dndList.map((entry) => (
                <tr key={entry.id} className="h-[52px] hover:bg-slate-50/50 transition-colors">
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.phone}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.added}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{entry.reason}</td>
                </tr>
              ))}
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
                    onChange={(e) => setDndForm({ ...dndForm, reason: e.target.value as DndEntry['reason'] })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E4E4E7] font-normal font-outfit focus:outline-none text-slate-800 text-xs bg-white cursor-pointer"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Opt-out via call">Opt-out via Call</option>
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
                  className="px-5 py-2 bg-[#18181B] hover:bg-black text-white rounded-lg font-normal transition-all shadow-2xs cursor-pointer"
                >
                  Add Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
