'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '../store';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Radio,
  PhoneCall,
  Settings,
  LineChart,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Award,
  Wallet,
  Bell,
  LogOut,
  Menu,
  X,
  ArrowUpRight
} from 'lucide-react';

import API_BASE from '../../config/api';

const formatRole = (role?: string) => {
  if (!role) return 'Admin';
  return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenant, wallet, setWallet, token, setToken, setUser, initStoreFromStorage } = useStore();

  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('10.00');
  const [isRecharging, setIsRecharging] = useState(false);

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Coming soon modal state
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);

  // Re-upload Modal State for Rejected Verification
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reuploadCountry, setReuploadCountry] = useState<'India' | 'United Kingdom'>('India');
  const [reuploadDoc, setReuploadDoc] = useState<File | null>(null);
  const [reuploadAddress, setReuploadAddress] = useState('');
  const [reuploadCompanyNumber, setReuploadCompanyNumber] = useState('');
  const [isReuploading, setIsReuploading] = useState(false);

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadDoc) {
      alert('Please select a company verification document.');
      return;
    }
    setIsReuploading(true);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
      const formData = new FormData();
      formData.append('country', reuploadCountry);
      formData.append('company_name', tenant?.companyName || 'Company');
      formData.append('company_email', tenant?.companyEmail || user?.email || '');
      formData.append('company_phone', tenant?.companyPhone || '');
      formData.append('owner_name', tenant?.ownerName || user?.full_name || '');
      formData.append('registered_address', reuploadAddress.trim() || tenant?.registeredAddress || 'Office Address');
      if (reuploadCountry === 'United Kingdom') {
        formData.append('company_number', reuploadCompanyNumber.trim() || tenant?.companyNumber || '');
      }
      formData.append('verification_doc', reuploadDoc);

      const res = await fetch(`${API_BASE}/onboarding/upload-company-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        useStore.getState().setTenant({
          verificationStatus: 'PENDING',
          verificationDocUrl: data.verification_doc_url,
          rejectionReason: undefined,
        });
        alert('Verification document re-uploaded successfully! Status updated to PENDING.');
        setShowReuploadModal(false);
      } else {
        const err = await res.json();
        alert(`Re-upload failed: ${err.detail || 'Error uploading file'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Re-upload failed. Please check network connection.');
    } finally {
      setIsReuploading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initStoreFromStorage();
    setMounted(true);
  }, [initStoreFromStorage]);

  useEffect(() => {
    if (!mounted) return;
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!activeToken) {
      router.push('/');
    }
  }, [token, mounted, router]);

  useEffect(() => {
    async function loadWallet() {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/tenant/wallet`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.status === 401) {
          setToken(null);
          setUser(null);
          router.push('/');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setWallet({ balance: data.balance / 100 });
        }
      } catch (err) {
        console.error("Failed to load wallet balance:", err);
      }
    }
    if (token) {
      loadWallet();
    }
  }, [token, setWallet]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const handleRechargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecharging(true);
    try {
      const cents = Math.round(parseFloat(rechargeAmount) * 100);
      if (isNaN(cents) || cents <= 0) {
        alert("Please enter a valid positive amount.");
        setIsRecharging(false);
        return;
      }
      const res = await fetch(`${API_BASE}/tenant/wallet/recharge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ amount: cents })
      });
      if (res.ok) {
        const data = await res.json();
        setWallet({ balance: data.balance / 100 });
        setShowRechargeModal(false);
        alert(`Successfully recharged ₹${(data.balance / 100).toFixed(2)}!`);
      } else {
        const err = await res.json();
        alert(`Recharge failed: ${err.detail || 'Server error'}`);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    } finally {
      setIsRecharging(false);
    }
  };

  // Nav Items matching Figma design (AI Configuration removed from sidebar, integrated into Settings)
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/dashboard/campaigns', icon: Megaphone },
    { name: 'Leads', path: '/dashboard/leads', icon: Users },
    { name: 'Live Monitor', path: '/dashboard/live-monitor', icon: Radio },
    { name: 'Call Logs', path: '/dashboard/call-logs', icon: PhoneCall },
    { name: 'Analytics', path: '/dashboard/analytics', icon: LineChart },
    { name: 'User Management', path: '/dashboard/user-management', icon: UserCheck },
    { name: 'Compilance', path: '/dashboard/compliance', icon: ShieldCheck },
    { name: 'Billing', path: '/dashboard/billing', icon: CreditCard },
    { name: 'Super Admin', path: '/dashboard/super-admin', icon: Award },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    setIsMobileMenuOpen(false);
    if (item.path.startsWith('#')) {
      setComingSoonFeature(item.name);
    } else {
      router.push(item.path);
    }
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white text-[#0f172a] select-none">
      {/* Brand logo matching image */}
      <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100">
        <span className="font-outfit font-extrabold text-2xl tracking-tight text-black">
          Logo
        </span>
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Ready</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${isActive
                  ? 'bg-[#111111] text-white shadow-sm'
                  : 'text-[#475569] hover:text-black hover:bg-[#f1f5f9]'
                }`}
            >
              <Icon className={`h-5 w-5 mr-3.5 ${isActive ? 'text-white' : 'text-[#94a3b8]'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer matches design */}
      <div className="p-5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="h-10 w-10 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center font-bold text-slate-700">
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'R'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-black truncate leading-tight">
              {user?.full_name || 'Rahul Agarwal'}
            </p>
            <p className="text-xs text-slate-500 font-medium leading-normal">
              {formatRole(user?.role)}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-slate-900 overflow-hidden font-sans">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-white border-r border-slate-200">
        {renderSidebarContent()}
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER BAR (Height: 76px, Border-bottom: 1px solid #D4D4D4, Background: #FFFFFF, Padding: 16px) */}
        <header className="h-[76px] bg-white border-b border-[#D4D4D4] flex items-center justify-between px-4 lg:px-6 py-4">
          <div className="flex items-center space-x-4">
            {/* Hamburger menu button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Sidebar toggle icon */}
            <button className="hidden lg:block p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Right Header Navigation Elements */}
          <div className="flex items-center space-x-4 font-outfit">
            {/* Notification Bell */}
            <button className="relative p-2.5 text-slate-700 hover:text-black bg-white hover:bg-slate-50 border border-[#D4D4D4] rounded-full cursor-pointer transition-all duration-150">
              <Bell className="h-5 w-5 text-slate-700" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
            </button>

            {/* Wallet Tracker (Height: 44px, Padding: 10px 16px 10px 20px, Gap: 8px, Border: 1px solid #D4D4D4, Radius: 8px) */}
            <div
              onClick={() => setShowRechargeModal(true)}
              className="h-[44px] flex items-center gap-2 bg-white pt-[10px] pr-[16px] pb-[10px] pl-[20px] rounded-lg border border-[#D4D4D4] hover:border-slate-400 transition-all duration-150 cursor-pointer text-center font-outfit font-medium text-[16px] leading-[24px] text-[#0A0A0A]"
            >
              <span className="text-[#0A0A0A] font-medium font-outfit">Wallet Balance:</span>
              <span className="text-[#0A0A0A] font-bold font-outfit">₹{(wallet?.balance !== undefined ? wallet.balance : 120.00).toFixed(2)}</span>
            </div>

            {/* AI Setup button */}
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="h-[44px] bg-[#18181B] hover:bg-black text-white px-4 rounded-lg text-sm font-normal font-outfit flex items-center gap-2 transition-all duration-150 cursor-pointer shadow-xs"
            >
              Go to AI Setup
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* VERIFICATION STATUS BANNERS */}
        {tenant?.verificationStatus === 'PENDING' ? (
          <div className="bg-amber-500 text-slate-950 px-6 py-3 border-b border-amber-600 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔒</span>
              <div>
                <p className="text-sm font-bold tracking-tight">
                  Verification Pending
                </p>
                <p className="text-xs text-slate-900 font-medium">
                  Your company documents are currently under review by the Super Admin. Full access will be available once your account is approved.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-slate-950 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
              Read-Only
            </span>
          </div>
        ) : tenant?.verificationStatus === 'REJECTED' ? (
          <div className="bg-red-600 text-white px-6 py-3 border-b border-red-700 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-bold tracking-tight">
                  Company Verification Rejected
                </p>
                <p className="text-xs text-red-100 font-medium">
                  Your submitted company documents could not be verified. {tenant.rejectionReason ? `Reason: ${tenant.rejectionReason}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setReuploadCountry(tenant.country || 'India');
                setReuploadAddress(tenant.registeredAddress || '');
                setReuploadCompanyNumber(tenant.companyNumber || '');
                setShowReuploadModal(true);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-red-700 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Re-upload Documents
            </button>
          </div>
        ) : tenant?.verificationStatus === 'SUSPENDED' ? (
          <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-950 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🚫</span>
              <div>
                <p className="text-sm font-bold tracking-tight">
                  Account Suspended
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  Your account has been suspended by administration. Please contact support.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
              Suspended
            </span>
          </div>
        ) : null}

        {/* VIEW SCROLLER */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc] p-4 lg:p-4">
          {children}
        </main>
      </div>

      {/* MOBILE DRAWER SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
          />
          {/* Drawer sheet */}
          <div className="relative w-[280px] h-full flex flex-col bg-white shadow-2xl animate-slide-in-left duration-300 z-10">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-4 p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex-1 h-full">
              {renderSidebarContent()}
            </div>
          </div>
        </div>
      )}

      {/* RECHARGE WALLET MODAL DIALOG */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs transition-all transform scale-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4.5 w-4.5 text-[#111111]" />
                <span className="font-bold text-slate-900 text-sm">Recharge Wallet</span>
              </div>
              <button onClick={() => setShowRechargeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRechargeSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recharge Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="10.00"
                      placeholder="100.00"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      className="w-full pl-7 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Recharge amount will be credited to your calling budget immediately.</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecharging}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {isRecharging ? 'Processing...' : 'Confirm Recharge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEATURE COMING SOON MODAL */}
      {comingSoonFeature && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Feature Coming Soon</h3>
              <p className="text-xs text-slate-500 mt-1">
                The <span className="font-semibold text-slate-800">&quot;{comingSoonFeature}&quot;</span> module is scheduled for release in the next dashboard version updates.
              </p>
            </div>
            <button
              onClick={() => setComingSoonFeature(null)}
              className="w-full bg-[#111111] hover:bg-black text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* RE-UPLOAD DOCUMENTS MODAL DIALOG */}
      {showReuploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                <span className="font-bold text-slate-900 text-sm">Re-upload Verification Documents</span>
              </div>
              <button onClick={() => setShowReuploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReuploadSubmit} className="p-6 space-y-4">
              {tenant?.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                  <p className="font-bold">Rejection Reason:</p>
                  <p>{tenant.rejectionReason}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Country *</label>
                <select
                  value={reuploadCountry}
                  onChange={(e) => setReuploadCountry(e.target.value as 'India' | 'United Kingdom')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="India">India</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>

              {reuploadCountry === 'United Kingdom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Number *</label>
                  <input
                    type="text"
                    required
                    value={reuploadCompanyNumber}
                    onChange={(e) => setReuploadCompanyNumber(e.target.value)}
                    placeholder="Enter Companies House Company Number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Office Address *</label>
                <textarea
                  required
                  value={reuploadAddress}
                  onChange={(e) => setReuploadAddress(e.target.value)}
                  placeholder="Enter complete registered office address"
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Verification Document *
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  {reuploadCountry === 'India'
                    ? 'GST Registration Certificate OR Certificate of Incorporation'
                    : 'Companies House Certificate of Incorporation'}
                </p>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReuploadDoc(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-900 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReuploadModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReuploading || !reuploadDoc}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isReuploading ? 'Resubmitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
