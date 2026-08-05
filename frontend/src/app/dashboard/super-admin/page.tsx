'use client';

import { useState } from 'react';

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
  { id: '5', name: 'Acme Spam Co', code: 'T-005', plan: 'Basic', status: 'Suspended', users: 1, calls: '8', created: '2026-06-22' },
];

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);

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
    <div className="space-y-4 text-slate-800 animate-fade-in font-outfit">

      {/* 1. HEADER TITLE CARD (Matching Analytics Page CSS structure) */}
      <div className="page-header-card">
        <div>
          <h1 className="page-header-title">
            Super Admin
          </h1>
          <p className="font-outfit font-normal text-xs text-[#71717A] mt-0.5">
            {tenants.length} tenants on the platform
          </p>
        </div>
      </div>

      {/* 2. TENANTS LIST TABLE CARD */}
      <div className="table-container">
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
