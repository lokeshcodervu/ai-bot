'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Representative' | 'Viewer';
  status: 'Active' | 'Invited' | 'Disabled';
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Aarav Sharma', email: 'aarav.s@gmail.com', role: 'Owner', status: 'Active' },
  { id: '2', name: 'Priya Iyer', email: 'priya.iyer@yahoo.com', role: 'Manager', status: 'Active' },
  { id: '3', name: 'Rohan Mehta', email: 'rohan.m@outlook.com', role: 'Representative', status: 'Active' },
  { id: '4', name: 'Ananya Reddy', email: 'ananya.r@gmail.com', role: 'Representative', status: 'Invited' },
  { id: '5', name: 'Kunal Verma', email: 'kunal.v@gmail.com', role: 'Viewer', status: 'Disabled' },
];

export default function UserManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Manager');

  const handleRemoveMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'Invited'
    };

    setMembers(prev => [...prev, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
    alert(`Invite sent to ${inviteEmail}!`);
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fade-in font-outfit">

      {/* 1. HEADER TITLE CARD (Matching Figma Image 2) */}
      <div className="page-header-card flex justify-between items-center">
        <div>
          <h1 className="page-header-title">
            Team
          </h1>
          <p className="font-outfit font-normal text-xs text-[#71717A] mt-0.5">
            {members.length} members in codervu workspace
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#D4D4D4] hover:bg-slate-50 text-xs font-normal font-outfit text-[#09090B] rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#09090B]" />
          Invite member
        </button>
      </div>

      {/* 2. TEAM MEMBERS LIST TABLE CARD */}
      <div className="table-container">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header-row">
                <th className="table-th">Name</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {members.map((member) => (
                <tr key={member.id} className="table-row">

                  {/* Name */}
                  <td className="table-td font-outfit font-normal text-[16px] leading-[24px] text-[#09090B]">
                    {member.name}
                  </td>

                  {/* Email */}
                  <td className="table-td font-outfit font-normal text-[16px] leading-[24px] text-[#09090B]">
                    {member.email}
                  </td>

                  {/* Role Badge */}
                  <td className="table-td">
                    {member.role === 'Owner' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#F4F4F5] border border-[#71717A] font-outfit font-normal text-[16px] leading-[24px] text-[#18181B]">
                        Owner
                      </span>
                    )}
                    {member.role === 'Manager' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#EFF6FF] border border-[#1D4ED8] font-outfit font-normal text-[16px] leading-[24px] text-[#1D4ED8]">
                        Manager
                      </span>
                    )}
                    {member.role === 'Representative' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#FFF7ED] border border-[#C2410C] font-outfit font-normal text-[16px] leading-[24px] text-[#C2410C]">
                        Representative
                      </span>
                    )}
                    {member.role === 'Viewer' && (
                      <span className="inline-flex items-center justify-center h-[36px] px-[12px] py-[6px] rounded-lg bg-[#F4F4F5] border border-[#A1A1AA] font-outfit font-normal text-[16px] leading-[24px] text-[#71717A]">
                        Viewer
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="table-td font-outfit font-normal text-[16px] leading-[24px] text-[#09090B]">
                    {member.status}
                  </td>

                  {/* Action */}
                  <td className="table-td">
                    <button
                      onClick={() => alert(`Edit member ${member.name}`)}
                      className="font-outfit font-normal text-[16px] leading-[20px] text-[#09090B] hover:underline cursor-pointer mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="font-outfit font-normal text-[16px] leading-[20px] text-[#F87171] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MEMBER MODAL DIALOG (Matching Figma Frame 200) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-outfit">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl border border-[#E5E5E5] overflow-hidden p-6 space-y-6 relative">

            {/* Header Title & Close Button */}
            <div className="flex justify-between items-center">
              <h3 className="font-outfit font-bold text-xl text-[#09090B]">Invite member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-normal text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#D4D4D4] focus:outline-none focus:border-slate-800 text-sm font-normal font-outfit"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-slate-500 uppercase mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#D4D4D4] font-normal font-outfit focus:outline-none text-slate-800 text-sm bg-white cursor-pointer"
                >
                  <option value="Manager">Manager</option>
                  <option value="Representative">Representative</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#18181B] hover:bg-black text-white rounded-lg text-sm font-semibold font-outfit transition-all cursor-pointer text-center shadow-sm"
                >
                  Send Invite
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
