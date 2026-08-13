'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Eye,
  FileText,
  Download,
  ShieldCheck,
  Mail,
  Phone,
  User,
  MapPin,
  Clock,
  Save
} from 'lucide-react';
import { useStore } from '../../../store';
import API_BASE from '../../../../config/api';

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

const MOCK_APPROVAL_DATA: CompanyVerificationItem[] = [
  {
    id: 'VER-1001',
    companyName: 'CoderVu Technologies Pvt Ltd',
    country: 'India',
    companyEmail: 'contact@codervu.com',
    phone: '+91 98765 43210',
    ownerName: 'Lokesh Kumar',
    registeredAddress: '1204, Tech Tower B, HSR Layout, Bengaluru, Karnataka 560102',
    companyNumber: '29ABCDE1234F1Z5',
    documentType: 'GST Registration Certificate',
    documentName: 'gst_certificate_codervu.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedAt: '2026-08-10 14:15',
    status: 'PENDING'
  },
  {
    id: 'VER-1002',
    companyName: 'Apex Voice Solutions Ltd',
    country: 'United Kingdom',
    companyEmail: 'hello@apexvoice.co.uk',
    phone: '+44 20 7946 0912',
    ownerName: 'Oliver Smith',
    registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    companyNumber: '12894720',
    documentType: 'Companies House Incorporation Cert',
    documentName: 'companies_house_cert_apex.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedAt: '2026-08-10 12:40',
    status: 'PENDING'
  },
  {
    id: 'VER-1003',
    companyName: 'Edutech Pvt Ltd',
    country: 'India',
    companyEmail: 'admin@edutech.in',
    phone: '+91 98111 22334',
    ownerName: 'Priya Sharma',
    registeredAddress: '45, MG Road, Connaught Place, New Delhi 110001',
    companyNumber: '07AAACE9988H1Z2',
    documentType: 'Certificate of Incorporation',
    documentName: 'incorporation_edutech.png',
    documentUrl: 'https://via.placeholder.com/800x600.png?text=Certificate+of+Incorporation',
    submittedAt: '2026-08-09 18:20',
    status: 'ON_HOLD',
    holdReason: 'Uploaded GST certificate text is blurry. Please re-upload a clear scanned PDF copy.'
  },
  {
    id: 'VER-1004',
    companyName: 'MedLife Health Systems',
    country: 'India',
    companyEmail: 'compliance@medlife.org',
    phone: '+91 99000 11223',
    ownerName: 'Dr. Rajesh Patel',
    registeredAddress: 'Sector 62, Institutional Area, Noida, Uttar Pradesh 201301',
    companyNumber: '09AAAFM4433K1Z9',
    documentType: 'GST Registration Certificate',
    documentName: 'gst_medlife.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedAt: '2026-08-08 10:10',
    status: 'APPROVED'
  },
  {
    id: 'VER-1005',
    companyName: 'Skyline Realty UK Ltd',
    country: 'United Kingdom',
    companyEmail: 'info@skylinerealty.co.uk',
    phone: '+44 161 496 0123',
    ownerName: 'James Wilson',
    registeredAddress: '15 Oxford Road, Manchester, M1 6EU',
    companyNumber: '99999999',
    documentType: 'Companies House Certificate',
    documentName: 'cert_skyline.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedAt: '2026-08-07 16:45',
    status: 'REJECTED',
    rejectionReason: 'Invalid Companies House registration number provided. Number does not match official UK database.'
  },
  {
    id: 'VER-1006',
    companyName: 'Zenith Financial Services',
    country: 'India',
    companyEmail: 'ops@zenithfin.com',
    phone: '+91 97777 66655',
    ownerName: 'Vikram Mehta',
    registeredAddress: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    companyNumber: '27AAACZ1122J1Z0',
    documentType: 'GST Registration Certificate',
    documentName: 'gst_zenith.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    submittedAt: '2026-08-10 15:05',
    status: 'PENDING'
  }
];

function ManageCompanyContent() {
  const router = useRouter();
  const { token } = useStore();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id') || '';

  const [company, setCompany] = useState<CompanyVerificationItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    country: 'India' as 'India' | 'United Kingdom',
    companyEmail: '',
    phone: '',
    ownerName: '',
    registeredAddress: '',
    companyNumber: ''
  });

  const [holdReasonInput, setHoldReasonInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const fetchCompanyDetails = async () => {
    if (!token || !requestId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const t = await res.json();
        const doc = (t.documents && t.documents[0]) || {};
        let normCountry: 'India' | 'United Kingdom' = 'India';
        if (t.country && t.country.toUpperCase().includes('UNITED')) {
          normCountry = 'United Kingdom';
        }
        const item: CompanyVerificationItem = {
          id: t.company_id,
          companyName: t.company_name,
          country: normCountry,
          companyEmail: t.company_email,
          phone: t.phone_number || t.company_phone || 'n/a',
          ownerName: t.owner_name,
          registeredAddress: t.registered_office_address || t.registered_address || 'n/a',
          companyNumber: t.company_number || '',
          documentType: doc.document_type || 'Verification Certificate',
          documentName: doc.file_name || 'document.pdf',
          documentUrl: doc.file_url || '',
          submittedAt: t.submitted_at ? new Date(t.submitted_at).toLocaleString() : 'Recent',
          status: t.verification_status,
          rejectionReason: t.rejection_reason || undefined
        };
        setCompany(item);
        setEditForm({
          companyName: item.companyName,
          country: item.country,
          companyEmail: item.companyEmail,
          phone: item.phone,
          ownerName: item.ownerName,
          registeredAddress: item.registeredAddress,
          companyNumber: item.companyNumber || ''
        });
        setRejectionReasonInput(item.rejectionReason || '');
      } else {
        const found = MOCK_APPROVAL_DATA.find(i => i.id === requestId) || MOCK_APPROVAL_DATA[0];
        setCompany(found);
      }
    } catch (err) {
      console.error("Error fetching company verification details:", err);
      const found = MOCK_APPROVAL_DATA.find(i => i.id === requestId) || MOCK_APPROVAL_DATA[0];
      setCompany(found);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [requestId, token]);

  if (!company) {
    return <div className="p-8 text-center text-slate-500 font-outfit">Loading verification request details...</div>;
  }

  const handleApprove = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications/${company.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        alert(`Company "${company.companyName}" has been successfully APPROVED!`);
        fetchCompanyDetails();
      } else {
        const err = await res.json();
        alert(`Approval failed: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error approving company verification.');
    }
  };

  const handlePutOnHold = () => {
    if (!holdReasonInput.trim()) {
      alert('Please specify a reason for putting the request on hold.');
      return;
    }
    setCompany(prev => prev ? { ...prev, status: 'ON_HOLD', holdReason: holdReasonInput, rejectionReason: undefined } : null);
    alert(`Request placed ON HOLD.`);
  };

  const handleReject = async () => {
    if (!rejectionReasonInput.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/admin/company-verifications/${company.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ reason: rejectionReasonInput.trim() })
      });
      if (res.ok) {
        alert(`Request REJECTED and notification sent to user.`);
        fetchCompanyDetails();
      } else {
        const err = await res.json();
        alert(`Rejection failed: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting company verification.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompany(prev => prev ? {
      ...prev,
      companyName: editForm.companyName,
      country: editForm.country,
      companyEmail: editForm.companyEmail,
      phone: editForm.phone,
      ownerName: editForm.ownerName,
      registeredAddress: editForm.registeredAddress,
      companyNumber: editForm.companyNumber
    } : null);
    setIsEditing(false);
    alert('Company details updated successfully!');
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4 max-w-6xl mx-auto">
      
      {/* HEADER BAR */}
      <div className="page-header-card justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/company-approvals')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Back to Company Approvals"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-header-title">{company.companyName}</h1>
            <p className="light-text">Manage Verification Request #{company.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {company.status === 'PENDING' && (
            <span className="px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold text-xs flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Review</span>
            </span>
          )}
          {company.status === 'APPROVED' && (
            <span className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-xs flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Approved</span>
            </span>
          )}
          {company.status === 'ON_HOLD' && (
            <span className="px-4 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-bold text-xs flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-purple-500" />
              <span>On Hold</span>
            </span>
          )}
          {company.status === 'REJECTED' && (
            <span className="px-4 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full font-bold text-xs flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Rejected</span>
            </span>
          )}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: COMPANY DETAILS & EDIT FORM (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-6 h-6 text-black" />
                <h2 className="section-heading">Company Information</h2>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 font-outfit cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Details</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all font-outfit cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              /* DISPLAY VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Company Name</label>
                  <p className="light-text font-semibold text-[#0A0A0A]">{company.companyName}</p>
                </div>

                <div>
                  <label className="form-label">Country Jurisdiction</label>
                  <p className="light-text font-semibold text-[#0A0A0A]">{company.country}</p>
                </div>

                <div>
                  <label className="form-label">Company Owner Name</label>
                  <p className="light-text font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#6D8A96]" />
                    <span>{company.ownerName}</span>
                  </p>
                </div>

                <div>
                  <label className="form-label">Work Email Address</label>
                  <p className="light-text font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-[#6D8A96]" />
                    <span>{company.companyEmail}</span>
                  </p>
                </div>

                <div>
                  <label className="form-label">Contact Phone Number</label>
                  <p className="light-text font-semibold text-[#0A0A0A] flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-[#6D8A96]" />
                    <span>{company.phone}</span>
                  </p>
                </div>

                <div>
                  <label className="form-label">Company Reg. Number</label>
                  <p className="light-text font-semibold text-[#0A0A0A] font-mono">{company.companyNumber || 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Registered Office Address</label>
                  <p className="light-text font-semibold text-[#0A0A0A] flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-[#6D8A96] mt-1 flex-shrink-0" />
                    <span>{company.registeredAddress}</span>
                  </p>
                </div>
              </div>
            ) : (
              /* EDIT FORM */
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      value={editForm.companyName}
                      onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="form-label">Country Jurisdiction *</label>
                    <select
                      value={editForm.country}
                      onChange={e => setEditForm({ ...editForm, country: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="India">India</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Owner Name *</label>
                    <input
                      type="text"
                      value={editForm.ownerName}
                      onChange={e => setEditForm({ ...editForm, ownerName: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="form-label">Work Email *</label>
                    <input
                      type="email"
                      value={editForm.companyEmail}
                      onChange={e => setEditForm({ ...editForm, companyEmail: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="form-label">Registration Number</label>
                    <input
                      type="text"
                      value={editForm.companyNumber}
                      onChange={e => setEditForm({ ...editForm, companyNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Registered Office Address *</label>
                  <textarea
                    value={editForm.registeredAddress}
                    onChange={e => setEditForm({ ...editForm, registeredAddress: e.target.value })}
                    rows={3}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* SUBMITTED DOCUMENT CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-emerald-600" />
                <h2 className="section-heading">Submitted Document</h2>
              </div>
              <span className="light-text">Type: <strong className="font-semibold text-[#0A0A0A]">{company.documentType}</strong></span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{company.documentName}</h4>
                  <p className="text-xs text-slate-400">Submitted on {company.submittedAt}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <a
                  href={company.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview Doc</span>
                </a>
                <a
                  href={company.documentUrl}
                  download
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS PANEL (1 COL) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              <h2 className="section-heading">Take Action</h2>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-4">
              
              {/* 1. APPROVE BUTTON */}
              <button
                onClick={handleApprove}
                className="w-full py-3.5 bg-[#00A36C] hover:bg-[#008F5E] text-white font-bold text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 font-outfit cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Approve Company</span>
              </button>

              {/* 2. ON HOLD SECTION */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="form-label">Put On Hold (Reason Required)</label>
                <textarea
                  value={holdReasonInput}
                  onChange={e => setHoldReasonInput(e.target.value)}
                  placeholder="e.g. GST certificate text is blurry..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
                <button
                  onClick={handlePutOnHold}
                  className="w-full py-2.5 bg-[#9333EA] hover:bg-[#7E22CE] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 font-outfit cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Put Request On Hold</span>
                </button>
              </div>

              {/* 3. REJECT SECTION */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="form-label">Reject Request (Reason Required)</label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  placeholder="e.g. Registration number does not match..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
                <button
                  onClick={handleReject}
                  className="w-full py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 font-outfit cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ManageCompanyApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-outfit">Loading page...</div>}>
      <ManageCompanyContent />
    </Suspense>
  );
}
