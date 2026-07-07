'use client';

import { useState } from 'react';
import { useStore } from '../../store';
import { 
  BellOff, 
  FileText, 
  Upload, 
  Plus, 
  ShieldAlert, 
  UserCheck, 
  History, 
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

    // Prepend to DND list
    setDndList(prev => [newEntry, ...prev]);

    // Push entry to audit log timeline
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      title: `Added ${dndForm.phone} to Do Not Disturb (DND) list`,
      user: user?.full_name || user?.username || 'Admin', // Current active Admin session
      time: 'Just now'
    };
    setAuditLogs(prev => [newAudit, ...prev]);

    // Reset Form
    setDndForm({ phone: '', reason: 'Manual' });
    setShowUploadModal(false);
    alert(`Phone number ${newEntry.phone} blacklisted from outbound calls.`);
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* HEADER TITLE */}
      <div>
        <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">Compilance</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">Workspace call auditing, blacklist indexes, and system feeds</p>
      </div>

      {/* TOP ROW STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: DND Entries */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">DND entries</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              {dndList.length}
            </h3>
          </div>
          <div className="p-1 text-slate-400">
            <BellOff className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Connection Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Connection Rate</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              38%
            </h3>
          </div>
          <div className="p-1 text-slate-400">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Leads Converted */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500">Leads Converted</p>
            <h3 className="text-3xl font-extrabold font-outfit text-slate-900 leading-none">
              94
            </h3>
          </div>
          <div className="p-1 text-slate-400">
            <FileText className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* DND LIST CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold font-outfit text-slate-900">Do Not Disturb (DND) list</h3>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center text-xs font-bold px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-xs"
          >
            <Upload className="h-4 w-4 mr-1.5" /> Upload list
          </button>
        </div>

        {/* DND List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 font-semibold">Phone</th>
                <th className="py-3.5 font-semibold">Added</th>
                <th className="py-3.5 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {dndList.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/20">
                  <td className="py-4 font-bold text-slate-900">{entry.phone}</td>
                  <td className="py-4 text-slate-400 font-semibold">{entry.added}</td>
                  <td className="py-4 text-slate-600 font-semibold">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOG TIMELINE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <h3 className="text-base font-bold font-outfit text-slate-900 border-b border-slate-100 pb-3">Audit log</h3>

        <div className="divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-4 flex justify-between items-start text-xs hover:bg-slate-50/20 transition-colors rounded-lg px-2">
              <div className="space-y-1">
                <p className="font-bold text-slate-900">{log.title}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{log.user}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-bold tracking-tight shrink-0 pl-4">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MOCK UPLOAD & MANUAL ADD DND MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4.5 w-4.5 text-black animate-pulse" />
                <span className="font-bold text-slate-900 text-sm">Upload Blacklist Entry</span>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDnd}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 99887 76655"
                    value={dndForm.phone}
                    onChange={(e) => setDndForm({ ...dndForm, phone: e.target.value.replace(/[^\d+]/g, '') })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Opt-out Reason</label>
                  <select
                    value={dndForm.reason}
                    onChange={(e) => setDndForm({ ...dndForm, reason: e.target.value as DndEntry['reason'] })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-black text-slate-800 text-xs bg-white cursor-pointer"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="Opt-out via call">Opt-out via Call</option>
                    <option value="Opt-out via SMS">Opt-out via SMS</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-[#1f2937] text-white rounded-lg font-semibold transition-all shadow-sm"
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
