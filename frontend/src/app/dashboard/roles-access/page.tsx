'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Edit3,
  Users,
  Check,
  X,
  Lock,
  Unlock,
  Building2,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Settings,
  Megaphone,
  Radio,
  PhoneCall,
  LineChart,
  CreditCard
} from 'lucide-react';

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  userCount: number;
  powers: string[];
}

interface ModulePermission {
  module: string;
  icon: any;
  view: boolean;
  create: boolean;  
  edit: boolean;
  delete: boolean;
}

const INITIAL_ROLES: RoleDefinition[] = [
  {
    id: 'tenant_admin',
    name: 'Tenant Admin',
    description: 'Full workspace authority for the company: manage campaigns, leads...',
    badgeColor: 'bg-[#E0EEFF] text-[#1E62D4] border-[#BFDBFE]',
    userCount: 14,
    powers: ['Manage Company Workspace', 'Create Campaigns & Leads', 'View Analytics & Billing', 'Invite & Manage Employees']
  },
  {
    id: 'campaign_manager',
    name: 'Campaign Manager',
    description: 'Manages outbound AI call campaigns, lead lists, and live call monitoring.',
    badgeColor: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
    userCount: 28,
    powers: ['Create & Edit Campaigns', 'Import Leads CSV', 'Monitor Live Calls', 'View Call Analytics']
  },
  {
    id: 'call_agent',
    name: 'Call Agent / Caller',
    description: 'Executes call triggers, views assigned lead logs, and handles manual call...',
    badgeColor: 'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
    userCount: 45,
    powers: ['View Assigned Leads', 'Listen to Call Logs', 'Trigger Manual Calls']
  },
  {
    id: 'auditor',
    name: 'Auditor / Compliance',
    description: 'Read-only access to compliance reports, transcripts, and call analytics.',
    badgeColor: 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]',
    userCount: 5,
    powers: ['Read-only Compliance Access', 'View Call Transcripts', 'Download Audit Reports']
  }
];

const INITIAL_MODULE_PERMISSIONS: ModulePermission[] = [
  { module: 'Campaigns', icon: Megaphone, view: true, create: true, edit: true, delete: false },
  { module: 'Leads & Contacts', icon: Users, view: true, create: true, edit: true, delete: true },
  { module: 'Voice & Script', icon: Radio, view: true, create: true, edit: true, delete: false },
  { module: 'Live Monitor', icon: Radio, view: true, create: false, edit: false, delete: false },
  { module: 'Call Logs & Transcripts', icon: PhoneCall, view: true, create: false, edit: false, delete: false },
  { module: 'Analytics & Reports', icon: LineChart, view: true, create: false, edit: false, delete: false },
  { module: 'Billing & Subscriptions', icon: CreditCard, view: true, create: false, edit: true, delete: false },
  { module: 'User & Role Management', icon: KeyRound, view: true, create: true, edit: true, delete: false }
];

export default function RolesAccessPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition>(INITIAL_ROLES[0]);
  const [permissions, setPermissions] = useState<ModulePermission[]>(INITIAL_MODULE_PERMISSIONS);

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

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4">

      {/* HEADER TITLE CARD */}
      <div className="page-header-card justify-between">
        <div>
          <h1 className="page-header-title">
            Roles & Permissions Access Control
          </h1>
          <p className="light-text mt-0.5">
            Super Admin & Admin Portal: Define employee roles, assign granular module powers, and create new team members.
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/roles-access/new-employee')}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-black hover:bg-[#1f2937] text-white cursor-pointer shadow-xs font-outfit"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Create New Employee & Assign Role</span>
        </button>
      </div>

      {/* SECTION 1: ROLE CARDS LIST (Exact Specs: 1108px max-w, 134px height, gap-16px, 0.5px border #1A1A1A) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {roles.map(role => {
          const isSelected = selectedRole.id === role.id;
          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`role-card-box ${isSelected ? 'active' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${role.badgeColor}`}>
                    {role.name}
                  </span>
                  <span className="text-xs font-semibold text-[#71717A]">{role.userCount} Users</span>
                </div>
                <p className="light-text mt-2 font-normal text-xs leading-5">
                  {role.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-xs font-bold text-[#18181B]">
                <span>{isSelected ? '✓ Selected Role' : 'Click to View Matrix'}</span>
                <ShieldCheck className={`w-4 h-4 ${isSelected ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: MODULE POWERS & PERMISSIONS MATRIX */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h2 className="section-heading flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 inline mr-2" />
              <span>Permission Matrix: {selectedRole.name}</span>
            </h2>
            <p className="light-text mt-0.5">
              Toggle specific powers (View, Create, Edit, Delete) for <strong className="text-[#0a0a0a] font-semibold">{selectedRole.name}</strong> role.
            </p>
          </div>

          <button
            onClick={() => alert(`Saved permission matrix updates for ${selectedRole.name}!`)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Role Permissions</span>
          </button>
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

                    {/* View */}
                    <td className="table-td text-center">
                      <input
                        type="checkbox"
                        checked={p.view}
                        onChange={() => togglePermission(p.module, 'view')}
                        className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                      />
                    </td>

                    {/* Create */}
                    <td className="table-td text-center">
                      <input
                        type="checkbox"
                        checked={p.create}
                        onChange={() => togglePermission(p.module, 'create')}
                        className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                      />
                    </td>

                    {/* Edit */}
                    <td className="table-td text-center">
                      <input
                        type="checkbox"
                        checked={p.edit}
                        onChange={() => togglePermission(p.module, 'edit')}
                        className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                      />
                    </td>

                    {/* Delete */}
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
    </div>
  );
}
