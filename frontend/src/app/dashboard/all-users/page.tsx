'use client';

import { useState } from 'react';
import {
  Users2,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  Building2,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  User as UserIcon,
  FileText,
  X,
  Filter,
  Download,
  Calendar,
  Sparkles,
  KeyRound
} from 'lucide-react';

interface SystemUserItem {
  id: string;
  userName: string;
  userEmail: string;
  phone: string;
  avatarUrl?: string;
  companyName: string;
  country: 'India' | 'United Kingdom';
  role: 'Super Admin' | 'Tenant Admin' | 'Manager' | 'Call Agent' | 'Auditor';
  plan: 'Pro Plan' | 'Basic Plan' | 'Free Trial' | 'Enterprise Plan';
  documentType: string;
  documentName: string;
  documentUrl: string;
  documentVerified: boolean;
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  dateTime: string;
}

const MOCK_ALL_USERS: SystemUserItem[] = [
  {
    id: 'USR-801',
    userName: 'Lokesh Kumar',
    userEmail: 'lokesh@codervu.com',
    phone: '+91 98765 43210',
    companyName: 'CoderVu Technologies Pvt Ltd',
    country: 'India',
    role: 'Tenant Admin',
    plan: 'Pro Plan',
    documentType: 'GST Registration Certificate',
    documentName: 'gst_codervu.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentVerified: true,
    status: 'ACTIVE',
    dateTime: '2026-08-10 14:30:15'
  },
  {
    id: 'USR-802',
    userName: 'Oliver Smith',
    userEmail: 'oliver@apexvoice.co.uk',
    phone: '+44 20 7946 0912',
    companyName: 'Apex Voice Solutions Ltd',
    country: 'United Kingdom',
    role: 'Tenant Admin',
    plan: 'Pro Plan',
    documentType: 'Companies House Incorporation Cert',
    documentName: 'companies_house_apex.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentVerified: false,
    status: 'PENDING_VERIFICATION',
    dateTime: '2026-08-10 12:40:00'
  },
  {
    id: 'USR-803',
    userName: 'Priya Sharma',
    userEmail: 'priya@edutech.in',
    phone: '+91 98111 22334',
    companyName: 'Edutech Pvt Ltd',
    country: 'India',
    role: 'Manager',
    plan: 'Basic Plan',
    documentType: 'Certificate of Incorporation',
    documentName: 'incorporation_edutech.png',
    documentUrl: 'https://via.placeholder.com/800x600.png?text=Certificate+of+Incorporation',
    documentVerified: true,
    status: 'ACTIVE',
    dateTime: '2026-08-09 18:20:45'
  },
  {
    id: 'USR-804',
    userName: 'Rahul Agarwal',
    userEmail: 'rahul@salesai.com',
    phone: '+91 99000 11223',
    companyName: 'SalesAI AI-Bot Headquarters',
    country: 'India',
    role: 'Super Admin',
    plan: 'Enterprise Plan',
    documentType: 'GST & Corporate Tax Certificate',
    documentName: 'corporate_tax_salesai.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentVerified: true,
    status: 'ACTIVE',
    dateTime: '2026-08-01 09:00:00'
  },
  {
    id: 'USR-805',
    userName: 'James Wilson',
    userEmail: 'james@skylinerealty.co.uk',
    phone: '+44 161 496 0123',
    companyName: 'Skyline Realty UK Ltd',
    country: 'United Kingdom',
    role: 'Tenant Admin',
    plan: 'Pro Plan',
    documentType: 'Companies House Certificate',
    documentName: 'skyline_companies_house.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentVerified: false,
    status: 'SUSPENDED',
    dateTime: '2026-08-07 16:45:10'
  },
  {
    id: 'USR-806',
    userName: 'Vikram Mehta',
    userEmail: 'vikram@zenithfin.com',
    phone: '+91 97777 66655',
    companyName: 'Zenith Financial Services',
    country: 'India',
    role: 'Call Agent',
    plan: 'Basic Plan',
    documentType: 'GST Registration Certificate',
    documentName: 'gst_zenith.pdf',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    documentVerified: true,
    status: 'ACTIVE',
    dateTime: '2026-08-10 15:05:30'
  }
];

export default function AllUsersPage() {
  const [users, setUsers] = useState<SystemUserItem[]>(MOCK_ALL_USERS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewDocItem, setViewDocItem] = useState<SystemUserItem | null>(null);
  const [editingUser, setEditingUser] = useState<SystemUserItem | null>(null);
  const [editRole, setEditRole] = useState<SystemUserItem['role']>('Tenant Admin');
  const [editStatus, setEditStatus] = useState<SystemUserItem['status']>('ACTIVE');

  // Filtered List
  const filteredUsers = users.filter(u => {
    if (activeTab === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (activeTab === 'PENDING' && u.status !== 'PENDING_VERIFICATION') return false;
    if (activeTab === 'SUSPENDED' && u.status !== 'SUSPENDED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.userName.toLowerCase().includes(q) ||
        u.userEmail.toLowerCase().includes(q) ||
        u.companyName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action Handlers
  const handleStartEdit = (user: SystemUserItem) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(prev =>
      prev.map(u =>
        u.id === editingUser.id
          ? { ...u, role: editRole, status: editStatus }
          : u
      )
    );
    alert(`Updated role & status for user ${editingUser.userName}!`);
    setEditingUser(null);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const newStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4">

      {/* HEADER TITLE CARD */}
      <div className="page-header-card justify-between">
        <div>
          <h1 className="page-header-title">
            All Registered System Users
          </h1>
          <p className="light-text mt-0.5">
            Complete user directory: Monitor company accounts, assigned roles, subscription plans, uploaded documents, status, and dates.
          </p>
        </div>

        <button
          onClick={() => alert('Refreshed system user directory.')}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-black hover:bg-[#1f2937] text-white cursor-pointer shadow-xs font-outfit"
        >
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Users</span>
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">Active Accounts</span>
          <p className="text-2xl font-black text-emerald-600">{users.filter(u => u.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">Pending Verification</span>
          <p className="text-2xl font-black text-amber-600">{users.filter(u => u.status === 'PENDING_VERIFICATION').length}</p>
        </div>
        <div className="bg-white border border-red-200 bg-red-50/20 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">Suspended Accounts</span>
          <p className="text-2xl font-black text-red-600">{users.filter(u => u.status === 'SUSPENDED').length}</p>
        </div>
      </div>

      {/* SEARCH BAR & FILTER TABS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
          {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`filter-tab-pill ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'ALL' && `All Users (${users.length})`}
              {tab === 'ACTIVE' && 'Active'}
              {tab === 'PENDING' && 'Pending Verification'}
              {tab === 'SUSPENDED' && 'Suspended'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[400px]">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[#6D8A96]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search user, company, role..."
            className="search-bar-input"
          />
        </div>
      </div>

      {/* EXACT USER TABLE REQUESTED BY USER */}
      {/* CALL LOGS STYLE TABLE CONTAINER */}
      <div className="table-container">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-th text-left">User</th>
                <th className="table-th text-left">Company</th>
                <th className="table-th text-center">Role</th>
                <th className="table-th text-center">Plan</th>
                <th className="table-th text-center">Docs</th>
                <th className="table-th text-center">Status</th>
                <th className="table-th text-center">Date Time</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-normal font-outfit">
                    No registered users match your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="table-row">

                    {/* 1. USER */}
                    <td className="table-td">
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{user.userName}</p>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{user.userEmail}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{user.phone}</span>
                        </p>
                      </div>
                    </td>

                    {/* 2. COMPANY */}
                    <td className="table-td">
                      <div>
                        <p className="font-bold text-slate-900">{user.companyName}</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                          {user.country === 'India' ? '🇮🇳 India' : '🇬🇧 UK'}
                        </span>
                      </div>
                    </td>

                    {/* 3. ROLE */}
                    <td className="table-td text-center">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${user.role === 'Super Admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : user.role === 'Tenant Admin'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{user.role}</span>
                      </span>
                    </td>

                    {/* 4. PLAN */}
                    <td className="table-td text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px]">
                        {user.plan}
                      </span>
                    </td>

                    {/* 5. DOCS */}
                    <td className="table-td text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[130px]" title={user.documentType}>
                            {user.documentType}
                          </span>
                        </div>
                        <button
                          onClick={() => setViewDocItem(user)}
                          className="mt-1 flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 font-bold text-[11px] hover:underline cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview Doc</span>
                        </button>
                      </div>
                    </td>

                    {/* 6. STATUS */}
                    <td className="table-td text-center">
                      {user.status === 'ACTIVE' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Active</span>
                        </span>
                      )}
                      {user.status === 'PENDING_VERIFICATION' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pending Docs</span>
                        </span>
                      )}
                      {user.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    {/* 7. DATE TIME */}
                    <td className="table-td text-center text-slate-500 text-[11px] font-mono">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.dateTime}</span>
                      </div>
                    </td>

                    {/* 8. ACTIONS */}
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleStartEdit(user)}
                          title="Edit User & Role"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          title={user.status === 'SUSPENDED' ? 'Activate User' : 'Suspend User'}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${user.status === 'SUSPENDED'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            }`}
                        >
                          {user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {viewDocItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Document Preview</h3>
                <p className="text-xs text-slate-500">{viewDocItem.userName} - {viewDocItem.companyName}</p>
              </div>
              <button
                onClick={() => setViewDocItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center text-center text-slate-300">
              <FileText className="w-12 h-12 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white mb-1">{viewDocItem.documentName}</h4>
              <p className="text-xs text-slate-400 mb-4">{viewDocItem.documentType}</p>

              <a
                href={viewDocItem.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Open Full Screen Document</span>
              </a>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDocItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER ROLE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit User & Role</h3>
                <p className="text-xs text-slate-500">{editingUser.userName} ({editingUser.userEmail})</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Role *</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as SystemUserItem['role'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Tenant Admin">Tenant Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Call Agent">Call Agent</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">User Status *</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as SystemUserItem['status'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white font-bold text-xs rounded-xl shadow-md"
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
