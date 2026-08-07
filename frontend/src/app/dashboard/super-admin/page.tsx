'use client';

import { useState, useEffect } from 'react';
import API_BASE from '../../../config/api';
import { useStore } from '../../store';

interface PendingTenant {
  id: string;
  company_name: string;
  country: string;
  company_email: string;
  company_phone: string;
  owner_name: string;
  company_number?: string;
  registered_address?: string;
  verification_status: string;
  verification_doc_url: string;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  code: string;
  plan: 'Pro' | 'Basic' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Suspended';
  users: number;
  calls: string;
  created: string;
}

const INITIAL_TENANTS: Tenant[] = [
  { id: '1', name: 'CoderVu Institute', code: 'T-001', plan: 'Pro', status: 'Active', users: 8, calls: '12,480', created: '2026-01-12' },
  { id: '2', name: 'Edutech Pvt Ltd', code: 'T-002', plan: 'Basic', status: 'Active', users: 3, calls: '1,820', created: '2026-03-04' },
  { id: '3', name: 'Realty Pros', code: 'T-003', plan: 'Enterprise', status: 'Active', users: 22, calls: '48,210', created: '2025-11-20' },
  { id: '4', name: 'InsureMate', code: 'T-004', plan: 'Pro', status: 'Trial', users: 2, calls: '145', created: '2026-06-18' },
];

export default function SuperAdminPage() {
  const { token } = useStore();
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [pendingTenants, setPendingTenants] = useState<PendingTenant[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState<boolean>(false);
  const [rejectingTenantId, setRejectingTenantId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const fetchPendingTenants = async () => {
    if (!token) return;
    setIsLoadingPending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingTenants(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending tenants:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPendingTenants();
  }, [token]);

  const handleApprove = async (tenantId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          allowed_modules: ["campaigns", "leads", "live_monitor", "analytics", "rag", "settings"]
        })
      });
      if (res.ok) {
        alert('Company verification APPROVED! Full application access has been granted to the tenant.');
        fetchPendingTenants();
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail || 'Error approving tenant'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while approving tenant.');
    }
  };

  const handleReject = async (tenantId: string) => {
    if (!token || !rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          reason: rejectionReason.trim()
        })
      });
      if (res.ok) {
        alert('Company verification REJECTED.');
        setRejectingTenantId(null);
        setRejectionReason('');
        fetchPendingTenants();
      } else {
        const err = await res.json();
        alert(`Rejection failed: ${err.detail || 'Error rejecting tenant'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while rejecting tenant.');
    }
  };

  const toggleStatus = (id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'Suspended' ? 'Active' : 'Suspended';
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit">

      {/* HEADER TITLE CARD */}
      <div className="page-header-card">
        <div>
          <h1 className="page-header-title">
            Super Admin Portal
          </h1>
          <p className="font-outfit font-normal text-xs text-[#71717A] mt-0.5">
            Manage company document approvals and platform tenancy isolation
          </p>
        </div>
      </div>

      {/* 1. PENDING COMPANY VERIFICATION REQUESTS CARD */}
      <div className="bg-white rounded-2xl border border-amber-300 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📋</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pending Verification Requests
              </h2>
              <p className="text-xs text-slate-500">
                Review submitted company documents and approve or reject verification requests
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
            {pendingTenants.length} Pending Approval
          </span>
        </div>

        {isLoadingPending ? (
          <p className="text-xs text-slate-500 py-4">Loading pending verification requests...</p>
        ) : pendingTenants.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500">✓ No pending company verification requests right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <th className="p-3">Company Details</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Registered Office Address</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {pendingTenants.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{pt.company_name}</p>
                      <p className="text-[11px] text-slate-500">{pt.company_email} • {pt.company_phone}</p>
                      {pt.company_number && (
                        <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Company No: {pt.company_number}</p>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {pt.country || 'India'}
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {pt.owner_name || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate" title={pt.registered_address}>
                      {pt.registered_address || 'N/A'}
                    </td>
                    <td className="p-3">
                      {pt.verification_doc_url ? (
                        <a
                          href={pt.verification_doc_url.startsWith('http') ? pt.verification_doc_url : `${API_BASE.replace('/api/v1', '')}${pt.verification_doc_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          <span>📄 View Documents</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">No Document</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-md text-[11px]">
                        PENDING
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(pt.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectingTenantId(pt.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REJECTION REASON MODAL */}
        {rejectingTenantId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">
                Reject Verification Request
              </h3>
              <p className="text-xs text-slate-500">
                Provide a clear reason for rejecting the submitted company documents:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Submitted document is illegible or missing required Companies House proof."
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-red-500"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => { setRejectingTenantId(null); setRejectionReason(''); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectingTenantId)}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. ACTIVE TENANTS LIST TABLE CARD */}
      <div className="table-container">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Tenants</h2>
          <span className="text-xs text-slate-500">{tenants.length} Active Organizations</span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-th">Tenant</th>
                <th className="table-th">Plan</th>
                <th className="table-th">Status</th>
                <th className="table-th">Users</th>
                <th className="table-th">Calls</th>
                <th className="table-th">Created</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="table-row">
                  
                  {/* Tenant Name & Code */}
                  <td className="table-td">
                    <p className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B]">
                      {tenant.name}
                    </p>
                    <p className="font-outfit font-normal text-xs text-[#71717A] mt-0.5">
                      {tenant.code}
                    </p>
                  </td>

                  {/* Plan */}
                  <td className="table-td">
                    {tenant.plan}
                  </td>

                  {/* Status Badge */}
                  <td className="table-td">
                    {tenant.status === 'Active' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#1A936F14] border border-[#1A936F] font-outfit font-normal text-[16px] leading-[24px] text-[#1A936F]">
                        Active
                      </span>
                    )}
                    {tenant.status === 'Trial' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#0284C714] border border-[#0284C7] font-outfit font-normal text-[16px] leading-[24px] text-[#0284C7]">
                        Trial
                      </span>
                    )}
                    {tenant.status === 'Suspended' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#EF444414] border border-[#EF4444] font-outfit font-normal text-[16px] leading-[24px] text-[#EF4444]">
                        Suspended
                      </span>
                    )}
                  </td>

                  {/* Users */}
                  <td className="table-td">
                    {tenant.users}
                  </td>

                  {/* Calls */}
                  <td className="table-td">
                    {tenant.calls}
                  </td>

                  {/* Created Date */}
                  <td className="table-td">
                    {tenant.created}
                  </td>

                  {/* Action */}
                  <td className="table-td">
                    <button
                      onClick={() => toggleStatus(tenant.id)}
                      className={`font-outfit font-normal text-[16px] leading-[20px] transition-colors cursor-pointer ${
                        tenant.status === 'Suspended'
                          ? 'text-[#557838] hover:underline'
                          : 'text-[#F87171] hover:underline'
                      }`}
                    >
                      {tenant.status === 'Suspended' ? 'Restore' : 'Suspend'}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
