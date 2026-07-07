'use client';

import { useState } from 'react';
import { Plus, User, Mail, Shield, UserCheck, X, Trash2, Edit2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Rep' | 'Viewer';
  status: 'Active' | 'Invited' | 'Disabled';
}

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'm-1', name: 'Aarav Sharma', email: 'aarav.s@gmail.com', role: 'Owner', status: 'Active' },
  { id: 'm-2', name: 'Priya Iyer', email: 'priya.iyer@yahoo.com', role: 'Manager', status: 'Active' },
  { id: 'm-3', name: 'Rohan Mehta', email: 'rohan.m@outlook.com', role: 'Rep', status: 'Active' },
  { id: 'm-4', name: 'Ananya Reddy', email: 'ananya.r@gmail.com', role: 'Rep', status: 'Invited' },
  { id: 'm-5', name: 'Kunal Verma', email: 'kunal.v@gmail.com', role: 'Viewer', status: 'Disabled' },
];

export default function UserManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Invite Form state
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Rep' as TeamMember['role'] });

  // Add Member
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) {
      alert('Please fill in Name and Email fields.');
      return;
    }

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      status: 'Invited'
    };

    setMembers(prev => [newMember, ...prev]);
    setInviteForm({ name: '', email: '', role: 'Rep' });
    setShowInviteModal(false);
    alert('Invitation sent successfully (local mockup)!');
  };

  // Edit Member
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setMembers(prev => prev.map(m => m.id === editingMember.id ? editingMember : m));
    setEditingMember(null);
    alert('Member details updated (local mockup)!');
  };

  // Delete Member
  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to remove this member from the workspace?')) {
      setMembers(prev => prev.filter(m => m.id !== id));
      setEditingMember(null);
      alert('Member deleted.');
    }
  };

  // Role Color styler matching mockup
  const getRoleStyle = (role: TeamMember['role']) => {
    switch (role) {
      case 'Owner':
        return 'text-emerald-600';
      case 'Manager':
        return 'text-red-500';
      case 'Rep':
        return 'text-amber-500';
      case 'Viewer':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  // Status Badge styler
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'Active':
        return 'text-slate-700 bg-slate-50 border border-slate-100';
      case 'Invited':
        return 'text-slate-500 bg-slate-50 border border-slate-100';
      case 'Disabled':
        return 'text-slate-400 bg-slate-50/50 border border-slate-100/50';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* HEADER SECTION TITLE CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold font-outfit text-slate-900 tracking-tight">Team</h1>
          <p className="text-xs text-slate-500 font-medium">
            {members.length} members in codervu workspace
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center text-xs font-bold px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Invite member
        </button>
      </div>

      {/* TEAM TABLE WHITE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{member.name}</td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className={`px-6 py-4 font-bold ${getRoleStyle(member.role)}`}>
                    {member.role}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setEditingMember(member)}
                      className="text-slate-400 hover:text-slate-700 font-semibold transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-4.5 w-4.5 text-black" />
                <span className="font-bold text-slate-900 text-sm">Invite Workspace Member</span>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Reddy"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ananya@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role Type</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as TeamMember['role'] })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-black text-slate-800 text-xs bg-white cursor-pointer"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Manager">Manager</option>
                    <option value="Rep">Rep</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-[#1f2937] text-white rounded-lg font-semibold transition-all shadow-sm"
                >
                  Invite Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT/DELETE MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-4 w-4 text-black" />
                <span className="font-bold text-slate-900 text-sm">Edit Member details</span>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role Type</label>
                    <select
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as TeamMember['role'] })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-black text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="Rep">Rep</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                    <select
                      value={editingMember.status}
                      onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as TeamMember['status'] })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-black text-slate-800 bg-white cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Invited">Invited</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleDeleteMember(editingMember.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold flex items-center transition-all border border-red-200/40"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                </button>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-black hover:bg-[#1f2937] text-white rounded-lg font-semibold transition-all shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
