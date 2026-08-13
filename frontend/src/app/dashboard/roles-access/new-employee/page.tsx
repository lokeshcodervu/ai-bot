'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Check,
  CheckCircle2,
  Users,
  Megaphone,
  Radio,
  PhoneCall,
  LineChart,
  CreditCard,
  Settings,
  Mail,
  User,
  Phone,
  Lock,
  Sparkles
} from 'lucide-react';

interface RoleOption {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
}

const ROLES_LIST: RoleOption[] = [
  {
    id: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full workspace authority for the company: manage campaigns, leads...',
    badgeColor: 'bg-[#E0EEFF] text-[#1E62D4] border-[#BFDBFE]'
  },
  {
    id: 'campaign_manager',
    name: 'Campaign Manager',
    description: 'Manages outbound AI call campaigns, lead lists, and live call monitoring.',
    badgeColor: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
  },
  {
    id: 'call_agent',
    name: 'Call Agent / Caller',
    description: 'Executes call triggers, views assigned lead logs, and handles manual call...',
    badgeColor: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]'
  },
  {
    id: 'auditor',
    name: 'Auditor / Compliance',
    description: 'Read-only access to compliance reports, transcripts, and call analytics.',
    badgeColor: 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]'
  }
];

interface ModulePermission {
  module: string;
  icon: any;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

const DEFAULT_PERMISSIONS: ModulePermission[] = [
  { module: 'Campaigns', icon: Megaphone, view: true, create: true, edit: true, delete: false },
  { module: 'Leads & Contacts', icon: Users, view: true, create: true, edit: true, delete: true },
  { module: 'Voice & Script', icon: Radio, view: true, create: true, edit: true, delete: false },
  { module: 'Live Monitor', icon: Radio, view: true, create: false, edit: false, delete: false },
  { module: 'Call Logs & Transcripts', icon: PhoneCall, view: true, create: false, edit: false, delete: false },
  { module: 'Analytics & Reports', icon: LineChart, view: true, create: false, edit: false, delete: false },
  { module: 'Billing & Subscriptions', icon: CreditCard, view: false, create: false, edit: false, delete: false },
  { module: 'User & Role Management', icon: KeyRound, view: false, create: false, edit: false, delete: false }
];

export default function CreateNewEmployeePage() {
  const router = useRouter();

  // Employee Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sendActivationEmail, setSendActivationEmail] = useState(true);

  // Selected Role
  const [selectedRoleId, setSelectedRoleId] = useState('campaign_manager');

  // Permissions Matrix
  const [permissions, setPermissions] = useState<ModulePermission[]>(DEFAULT_PERMISSIONS);

  const togglePermission = (moduleName: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.module === moduleName) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter Employee Full Name.');
      return;
    }
    if (!email.trim()) {
      alert('Please enter Work Email Address.');
      return;
    }

    const assignedRole = ROLES_LIST.find(r => r.id === selectedRoleId)?.name || 'Employee';
    alert(
      `New Employee '${fullName.trim()}' account created successfully!\nAssigned Role: ${assignedRole}\nActivation invite email sent to ${email.trim()}.`
    );
    router.push('/dashboard/roles-access');
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4 max-w-5xl mx-auto">

      {/* BACK BUTTON & PAGE HEADER */}
      <div className="page-header-card justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/roles-access')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Back to Roles"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-header-title">
              Create New Employee & Assign Role
            </h1>
            <p className="light-text mt-0.5">
              Super Admin & Admin Portal: Enter employee details, select role authority, and configure module access powers.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/roles-access')}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-outfit"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1: PERSONAL & ACCOUNT INFORMATION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-6 h-6 text-emerald-600" />
            <h2 className="section-heading">Employee Account Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Employee Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Work Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendActivationEmail}
                onChange={e => setSendActivationEmail(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-0 accent-black"
              />
              <span className="light-text">Send automated password setup email invitation to new employee</span>
            </label>
          </div>
        </div>

        {/* SECTION 2: CLICKABLE ROLE SELECTION CARDS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-6 h-6 text-purple-600" />
            <h2 className="section-heading">Select Role Authority</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {ROLES_LIST.map(role => {
              const isSelected = selectedRoleId === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`role-card-box ${isSelected ? 'active' : ''}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${role.badgeColor}`}>
                        {role.name}
                      </span>
                    </div>
                    <p className="light-text mt-2 font-normal text-xs leading-5">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-xs font-bold text-[#18181B]">
                    <span>{isSelected ? '✓ Selected Role' : 'Select Role'}</span>
                    <ShieldCheck className={`w-4 h-4 ${isSelected ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: GRANULAR MODULE ACCESS POWERS MATRIX */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="section-heading">Configure Module Access Powers</h2>
            </div>
            <span className="light-text">
              Assigned Role: <strong className="text-[#0A0A0A] font-semibold">{ROLES_LIST.find(r => r.id === selectedRoleId)?.name}</strong>
            </span>
          </div>

          {/* PERMISSIONS TABLE (Standard Dashboard Table CSS Classes) */}
          <div className="table-card-box mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header-row">
                  <th className="table-th text-left">Module Name</th>
                  <th className="table-th text-center">View (Read)</th>
                  <th className="table-th text-center">Create (Add)</th>
                  <th className="table-th text-center">Edit (Modify)</th>
                  <th className="table-th text-center">Delete (Remove)</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(p => {
                  const Icon = p.icon;
                  return (
                    <tr key={p.module} className="table-row">
                      <td className="table-td text-left">
                        <div className="flex items-center space-x-2.5">
                          <Icon className="w-4 h-4 text-[#71717A]" />
                          <span className="font-semibold text-[#0a0a0a] text-sm">{p.module}</span>
                        </div>
                      </td>

                      <td className="table-td text-center">
                        <input
                          type="checkbox"
                          checked={p.view}
                          onChange={() => togglePermission(p.module, 'view')}
                          className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                        />
                      </td>

                      <td className="table-td text-center">
                        <input
                          type="checkbox"
                          checked={p.create}
                          onChange={() => togglePermission(p.module, 'create')}
                          className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                        />
                      </td>

                      <td className="table-td text-center">
                        <input
                          type="checkbox"
                          checked={p.edit}
                          onChange={() => togglePermission(p.module, 'edit')}
                          className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                        />
                      </td>

                      <td className="table-td text-center">
                        <input
                          type="checkbox"
                          checked={p.delete}
                          onChange={() => togglePermission(p.module, 'delete')}
                          className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUBMIT BUTTON ROW */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/roles-access')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all font-outfit"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 font-outfit"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Employee Account & Grant Access</span>
          </button>
        </div>

      </form>

    </div>
  );
}
