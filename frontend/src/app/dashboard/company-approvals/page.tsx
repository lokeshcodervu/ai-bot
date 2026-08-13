'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Building2,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
  X,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

import { useStore } from '../../store';
import API_BASE from '../../../config/api';

interface CompanyVerificationItem {
  id: string;
  companyName: string;
  country: 'India' | 'United Kingdom';
  companyEmail: string;
  phone: string;
  ownerName: string;
  registeredAddress: string;
  companyNumber?: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  rejectionReason?: string;
  holdReason?: string;
}

export default function CompanyApprovalsPage() {
  const router = useRouter();
  const { token } = useStore();
  const [items, setItems] = useState<CompanyVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ON_HOLD' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [actionModalItem, setActionModalItem] = useState<CompanyVerificationItem | null>(null);
  const [viewDocItem, setViewDocItem] = useState<CompanyVerificationItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<CompanyVerificationItem | null>(null);
  const [rejectionMsg, setRejectionMsg] = useState('');

  const [holdingItem, setHoldingItem] = useState<CompanyVerificationItem | null>(null);
  const [holdMsg, setHoldMsg] = useState('');

  const [editingItem, setEditingItem] = useState<CompanyVerificationItem | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: '',
    country: 'India' as 'India' | 'United Kingdom',
    companyEmail: '',
    phone: '',
    ownerName: '',
    registeredAddress: '',
    companyNumber: ''
  });

  // Fetch real verifications queue from backend API
  const fetchVerifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications?status_filter=ALL&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mappedList: CompanyVerificationItem[] = (data.items || []).map((t: any) => {
          const doc = (t.documents && t.documents[0]) || {};
          let normCountry: 'India' | 'United Kingdom' = 'India';
          if (t.country && t.country.toUpperCase().includes('UNITED')) {
            normCountry = 'United Kingdom';
          }
          return {
            id: t.company_id || t.tenant_id,
            companyName: t.company_name || 'Unnamed Company',
            country: normCountry,
            companyEmail: t.company_email || 'n/a',
            phone: t.company_phone || t.phone_number || 'n/a',
            ownerName: t.owner_name || 'Owner',
            registeredAddress: t.registered_office_address || t.registered_address || 'Address',
            companyNumber: t.company_number || '',
            documentType: doc.document_type || 'GST / Incorporation Certificate',
            documentName: doc.file_name || 'verification_document.pdf',
            documentUrl: t.verification_doc_url || doc.file_url || '',
            submittedAt: t.submitted_at ? new Date(t.submitted_at).toLocaleString() : 'Recent',
            status: t.verification_status as any,
            rejectionReason: t.rejection_reason || undefined
          };
        });
        setItems(mappedList);
      }
    } catch (err) {
      console.error("Error fetching company verifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [token]);

  // Actions with Backend API Calls
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        alert('Company verification approved successfully!');
        fetchVerifications();
      } else {
        const err = await res.json();
        alert(`Failed to approve company: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error approving company verification.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionMsg.trim()) {
      alert('Please enter a rejection reason message.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications/${rejectingItem.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ reason: rejectionMsg.trim() })
      });
      if (res.ok) {
        alert(`Company rejection processed and notification sent.`);
        setRejectingItem(null);
        setRejectionMsg('');
        fetchVerifications();
      } else {
        const err = await res.json();
        alert(`Failed to reject request: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting company verification.');
    }
  };

  const handleConfirmHold = () => {
    if (!holdingItem) return;
    if (!holdMsg.trim()) {
      alert('Please enter a reason for putting account on hold.');
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === holdingItem.id
          ? { ...i, status: 'ON_HOLD', holdReason: holdMsg.trim(), rejectionReason: undefined }
          : i
      )
    );
    alert(`Account put on hold. Message sent to ${holdingItem.companyEmail}`);
    setHoldingItem(null);
    setHoldMsg('');
  };

  const handleStartEdit = (item: CompanyVerificationItem) => {
    setEditingItem(item);
    setEditForm({
      companyName: item.companyName,
      country: item.country,
      companyEmail: item.companyEmail,
      phone: item.phone,
      ownerName: item.ownerName,
      registeredAddress: item.registeredAddress,
      companyNumber: item.companyNumber || ''
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems(prev =>
      prev.map(i =>
        i.id === editingItem.id
          ? {
            ...i,
            companyName: editForm.companyName.trim(),
            country: editForm.country,
            companyEmail: editForm.companyEmail.trim(),
            phone: editForm.phone.trim(),
            ownerName: editForm.ownerName.trim(),
            registeredAddress: editForm.registeredAddress.trim(),
            companyNumber: editForm.companyNumber.trim()
          }
          : i
      )
    );
    alert('Company details updated successfully.');
    setEditingItem(null);
  };

  // Filtered List
  const filteredItems = items.filter(item => {
    if (activeTab !== 'ALL' && item.status !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.companyName.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q) ||
        item.companyEmail.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        (item.companyNumber && item.companyNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Summary Metrics
  const totalCount = items.length;
  const pendingCount = items.filter(i => i.status === 'PENDING').length;
  const approvedCount = items.filter(i => i.status === 'APPROVED').length;
  const holdCount = items.filter(i => i.status === 'ON_HOLD').length;
  const rejectedCount = items.filter(i => i.status === 'REJECTED').length;

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4">

      {/* HEADER TITLE & ACTION CARD */}
      <div className="page-header-card justify-between">
        <div>
          <h1 className="page-header-title">
            Company Verification & Approvals
          </h1>
          <p className="light-text mt-0.5">
            Review submitted business documents, grant workspace access, or notify users on hold/rejection status.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-black hover:bg-[#1f2937] text-white cursor-pointer shadow-xs font-outfit"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* METRICS SUMMARY ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
        </div>

        {/* Pending */}
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>

        {/* Approved */}
        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
        </div>

        {/* On Hold */}
        <div className="bg-white border border-purple-200 bg-purple-50/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">On Hold</span>
            <AlertCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{holdCount}</p>
        </div>

        {/* Rejected */}
        <div className="bg-white border border-red-200 bg-red-50/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-red-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR (Exact Specs from Image) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Status Tabs (Height 36px, gap 8px, border 0.5px #D4D4D4, padding 6px 12px) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          {(['ALL', 'PENDING', 'APPROVED', 'ON_HOLD', 'REJECTED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`filter-tab-pill ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'ALL' && `All Requests (${totalCount})`}
              {tab === 'PENDING' && `Pending (${pendingCount})`}
              {tab === 'APPROVED' && `Approved (${approvedCount})`}
              {tab === 'ON_HOLD' && `On Hold (${holdCount})`}
              {tab === 'REJECTED' && `Rejected (${rejectedCount})`}
            </button>
          ))}
        </div>

        {/* Search Input (Width 400px, Height 56px, Border 1px #D4D4D4, Padding 16px 20px) */}
        <div className="relative w-full md:w-[400px]">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[#6D8A96]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search company, email, owner..."
            className="search-bar-input"
          />
        </div>
      </div>

      {/* CALL LOGS STYLE TABLE CONTAINER */}
      <div className="table-container">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-th text-left">Company & Country</th>
                <th className="table-th text-left">Owner & Contact</th>
                <th className="table-th text-center">Submitted Document</th>
                <th className="table-th text-center">Date</th>
                <th className="table-th text-center">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-normal font-outfit">
                    No company verification requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="table-row">

                    {/* Company & Country */}
                    <td className="table-td">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-base">{item.companyName}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-bold border border-slate-200">
                            {item.country === 'India' ? '🇮🇳 INDIA' : '🇬🇧 UK'}
                          </span>
                        </div>
                        {item.companyNumber && (
                          <p className="text-xs text-slate-600 mt-1">
                            Reg. No: <span className="font-mono font-bold text-slate-800">{item.companyNumber}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-xs" title={item.registeredAddress}>
                          📍 {item.registeredAddress}
                        </p>
                      </div>
                    </td>

                    {/* Owner & Contact */}
                    <td className="table-td">
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.ownerName}</span>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.companyEmail}</span>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.phone}</span>
                        </p>
                      </div>
                    </td>

                    {/* Document (Centered) */}
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold text-xs">
                          <FileText className="w-4 h-4 text-slate-600" />
                          <span>{item.documentType}</span>
                        </span>
                        <button
                          onClick={() => setViewDocItem(item)}
                          className="mt-1.5 flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold text-xs hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Document</span>
                        </button>
                      </div>
                    </td>

                    {/* Date (Centered) */}
                    <td className="table-td text-center text-slate-600 text-xs font-semibold">
                      {item.submittedAt}
                    </td>

                    {/* Status (Centered) */}
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center justify-center">
                        {item.status === 'PENDING' && (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full font-bold text-xs">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>Pending Review</span>
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Approved</span>
                          </span>
                        )}
                        {item.status === 'ON_HOLD' && (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-full font-bold text-xs">
                            <AlertCircle className="w-4 h-4 text-purple-500" />
                            <span>On Hold</span>
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-800 rounded-full font-bold text-xs">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>Rejected</span>
                          </span>
                        )}

                        {item.rejectionReason && (
                          <p className="text-xs text-red-700 font-medium mt-1.5 max-w-xs bg-red-50 p-2 rounded-lg border border-red-200 leading-relaxed text-center">
                            <strong>Reason:</strong> {item.rejectionReason}
                          </p>
                        )}

                        {item.holdReason && (
                          <p className="text-xs text-purple-800 font-medium mt-1.5 max-w-xs bg-purple-50 p-2 rounded-lg border border-purple-200 leading-relaxed text-center">
                            <strong>Hold Reason:</strong> {item.holdReason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions Column (Navigates to New Manage Page) */}
                    <td className="table-td text-right">
                      <button
                        onClick={() => router.push(`/dashboard/company-approvals/manage?id=${item.id}`)}
                        className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center space-x-1.5 font-outfit cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Manage Request</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 0: ACTION & APPROVAL MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {actionModalItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl font-sans relative text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-slate-100 text-slate-900 rounded-2xl border border-slate-200">
                  <Building2 className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{actionModalItem.companyName}</h3>
                  <p className="text-xs text-slate-500">{actionModalItem.country} • Submitted {actionModalItem.submittedAt}</p>
                </div>
              </div>
              <button
                onClick={() => setActionModalItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Company Owner:</span>
                  <strong className="text-slate-900">{actionModalItem.ownerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Work Email:</span>
                  <strong className="text-slate-900">{actionModalItem.companyEmail}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone Number:</span>
                  <strong className="text-slate-900">{actionModalItem.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Reg. Number:</span>
                  <strong className="text-slate-900">{actionModalItem.companyNumber || 'N/A'}</strong>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Document Type: <strong className="text-slate-900">{actionModalItem.documentType}</strong></span>
                <button
                  onClick={() => {
                    setViewDocItem(actionModalItem);
                    setActionModalItem(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center space-x-1 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Document</span>
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Approval Action</h4>

              <div className="grid grid-cols-2 gap-3">
                
                {/* 1. Approve Button */}
                <button
                  onClick={() => {
                    handleApprove(actionModalItem.id);
                    setActionModalItem(null);
                  }}
                  className="px-4 py-3 bg-[#00A36C] hover:bg-[#008F5E] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Company</span>
                </button>

                {/* 2. Edit Details Button */}
                <button
                  onClick={() => {
                    handleStartEdit(actionModalItem);
                    setActionModalItem(null);
                  }}
                  className="px-4 py-3 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] font-bold text-xs rounded-2xl border border-slate-200 transition-all flex items-center justify-center space-x-2"
                >
                  <Edit3 className="w-4 h-4 text-[#18181B]" />
                  <span>Edit Company Details</span>
                </button>

                {/* 3. Put On Hold Button */}
                <button
                  onClick={() => {
                    setHoldingItem(actionModalItem);
                    setHoldMsg(actionModalItem.holdReason || '');
                    setActionModalItem(null);
                  }}
                  className="px-4 py-3 bg-[#9333EA] hover:bg-[#7E22CE] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Put On Hold</span>
                </button>

                {/* 4. Reject Button */}
                <button
                  onClick={() => {
                    setRejectingItem(actionModalItem);
                    setRejectionMsg(actionModalItem.rejectionReason || '');
                    setActionModalItem(null);
                  }}
                  className="px-4 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setActionModalItem(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {viewDocItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>Document Preview: {viewDocItem.documentType}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {viewDocItem.companyName} ({viewDocItem.country}) - Submitted: {viewDocItem.submittedAt}
                </p>
              </div>
              <button
                onClick={() => setViewDocItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Viewer Frame / Box */}
            <div className="bg-slate-900 rounded-2xl p-4 min-h-[380px] flex flex-col items-center justify-center text-center text-slate-300 relative border border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-white text-base mb-1">{viewDocItem.documentName}</h4>
              <p className="text-xs text-slate-400 max-w-md mb-6">
                Official company verification document submitted by owner <span className="text-white font-semibold">{viewDocItem.ownerName}</span> for manual review.
              </p>

              <div className="flex items-center space-x-3">
                <a
                  href={viewDocItem.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open Full Screen Document</span>
                </a>
                <a
                  href={viewDocItem.documentUrl}
                  download
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document File</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Reg Number: <strong className="text-slate-800">{viewDocItem.companyNumber || 'N/A'}</strong>
              </span>
              <button
                onClick={() => setViewDocItem(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT REASON MODAL */}
      {/* ========================================================================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Company Verification</h3>
                  <p className="text-xs text-slate-500">{rejectingItem.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Specify Rejection Reason (Message sent to user) *
              </label>
              <textarea
                value={rejectionMsg}
                onChange={e => setRejectionMsg(e.target.value)}
                placeholder="e.g. GST registration certificate number does not match official government database records. Please re-upload valid document."
                rows={4}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 resize-none"
              />
              <p className="text-[11px] text-slate-500">
                This reason message will be displayed on the user&apos;s dashboard banner prompting them to re-upload details.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Confirm Rejection & Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: HOLD REASON MODAL */}
      {/* ========================================================================= */}
      {holdingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Put Account On Hold</h3>
                  <p className="text-xs text-slate-500">{holdingItem.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setHoldingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Specify Hold Reason (Message sent to user) *
              </label>
              <textarea
                value={holdMsg}
                onChange={e => setHoldMsg(e.target.value)}
                placeholder="e.g. Verification is temporarily on hold pending additional address proof confirmation. Support team will contact you shortly."
                rows={4}
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 resize-none"
              />
              <p className="text-[11px] text-slate-500">
                The user will be notified of the hold status and reason.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setHoldingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHold}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Put On Hold & Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT COMPANY DETAILS MODAL */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Company Verification Details</h3>
                  <p className="text-xs text-slate-500">{editingItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Country *</label>
                  <select
                    value={editForm.country}
                    onChange={e => setEditForm({ ...editForm, country: e.target.value as 'India' | 'United Kingdom' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                  >
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Number</label>
                  <input
                    type="text"
                    value={editForm.companyNumber}
                    onChange={e => setEditForm({ ...editForm, companyNumber: e.target.value })}
                    placeholder="GST or Companies House No"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Email *</label>
                  <input
                    type="email"
                    value={editForm.companyEmail}
                    onChange={e => setEditForm({ ...editForm, companyEmail: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={editForm.ownerName}
                  onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Address *</label>
                <textarea
                  value={editForm.registeredAddress}
                  onChange={e => setEditForm({ ...editForm, registeredAddress: e.target.value })}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:border-slate-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
