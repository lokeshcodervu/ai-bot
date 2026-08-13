'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Edit3,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  DollarSign,
  Users,
  Megaphone,
  PhoneCall,
  X,
  Search,
  RefreshCw,
  Bell,
  Mail,
  ShieldCheck,
  TrendingUp,
  Layers,
  Star
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string; // e.g. "₹0", "₹2,499", "₹4,999", "Custom"
  priceNumeric: number;
  billingCycle: 'monthly' | 'yearly';
  maxVoices: number;
  maxCampaigns: number;
  maxCalls: number;
  freeTierPerks: string[];
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
}

interface ExpiringUser {
  id: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  currentPlan: string;
  expiryDate: string;
  daysRemaining: number;
  status: 'EXPIRING_SOON' | 'EXPIRED';
}

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Trial / Starter',
    price: '₹0',
    priceNumeric: 0,
    billingCycle: 'monthly',
    maxVoices: 1,
    maxCampaigns: 1,
    maxCalls: 100,
    freeTierPerks: [
      '1 Free AI Voice',
      '1 Campaign slot',
      '100 Free Call Minutes',
      'Community Email Support'
    ],
    features: [
      '1 AI Voice access',
      '1 Active Campaign',
      '100 Included Call Minutes',
      'Basic Call Logs & Dashboard'
    ],
    isActive: true
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '₹2,499',
    priceNumeric: 2499,
    billingCycle: 'monthly',
    maxVoices: 2,
    maxCampaigns: 5,
    maxCalls: 1500,
    freeTierPerks: [
      '2 AI Voices included',
      '5 Active Campaigns',
      '1,500 Call Minutes/mo'
    ],
    features: [
      '2 AI Voice Clones',
      '5 Simultaneous Campaigns',
      '1,500 Included Minutes',
      'Email & Chat Support',
      'Basic Analytics'
    ],
    isActive: true
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '₹4,999',
    priceNumeric: 4999,
    billingCycle: 'monthly',
    maxVoices: 5,
    maxCampaigns: 25,
    maxCalls: 10000,
    freeTierPerks: [
      '5 Premium AI Voices',
      '25 Campaigns',
      '10,000 Call Minutes/mo',
      'Priority Support & Live Monitor'
    ],
    features: [
      '5 High Quality AI Voices',
      'Unlimited Campaigns (up to 25 active)',
      '10,000 Included Minutes',
      'Real-time Live Audio Monitoring',
      'Priority 24/7 Support',
      'Custom Webhooks & Integrations'
    ],
    isPopular: true,
    isActive: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: '₹14,999',
    priceNumeric: 14999,
    billingCycle: 'monthly',
    maxVoices: 20,
    maxCampaigns: 100,
    maxCalls: 50000,
    freeTierPerks: [
      'Custom Voice Cloning',
      'Unlimited Campaigns',
      '50,000 Call Minutes/mo',
      'Dedicated Account Manager'
    ],
    features: [
      'All AI Voices & Custom Cloning',
      'Unlimited Campaigns',
      '50,000 Included Minutes',
      'Dedicated Account Manager',
      'SSO & SLA Guarantees',
      'Custom RAG Knowledgebase'
    ],
    isActive: true
  }
];

const MOCK_EXPIRING_USERS: ExpiringUser[] = [
  {
    id: 'SUB-101',
    companyName: 'Edutech Pvt Ltd',
    ownerName: 'Priya Sharma',
    email: 'admin@edutech.in',
    phone: '+91 98111 22334',
    currentPlan: 'Pro Plan',
    expiryDate: '2026-08-12',
    daysRemaining: 2,
    status: 'EXPIRING_SOON'
  },
  {
    id: 'SUB-102',
    companyName: 'InsureMate Systems',
    ownerName: 'Amit Verma',
    email: 'amit@insuremate.com',
    phone: '+91 98765 11223',
    currentPlan: 'Basic Plan',
    expiryDate: '2026-08-13',
    daysRemaining: 3,
    status: 'EXPIRING_SOON'
  },
  {
    id: 'SUB-103',
    companyName: 'Skyline Realty UK Ltd',
    ownerName: 'James Wilson',
    email: 'info@skylinerealty.co.uk',
    phone: '+44 161 496 0123',
    currentPlan: 'Pro Plan',
    expiryDate: '2026-08-09',
    daysRemaining: -1,
    status: 'EXPIRED'
  },
  {
    id: 'SUB-104',
    companyName: 'Zenith Financial Services',
    ownerName: 'Vikram Mehta',
    email: 'ops@zenithfin.com',
    phone: '+91 97777 66655',
    currentPlan: 'Pro Plan',
    expiryDate: '2026-08-15',
    daysRemaining: 5,
    status: 'EXPIRING_SOON'
  }
];

export default function SubscriptionsPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(MOCK_PLANS);
  const [expiringUsers, setExpiringUsers] = useState<ExpiringUser[]>(MOCK_EXPIRING_USERS);
  const [activeTab, setActiveTab] = useState<'PLANS' | 'EXPIRING'>('PLANS');
  const [searchQuery, setSearchQuery] = useState('');

  const [messagingUser, setMessagingUser] = useState<ExpiringUser | null>(null);
  const [customMsg, setCustomMsg] = useState('');

  const handleStartCreate = () => {
    router.push('/dashboard/subscriptions-plans/new');
  };

  const handleStartEdit = (plan: SubscriptionPlan) => {
    router.push(`/dashboard/subscriptions-plans/edit/${plan.id}`);
  };

  const togglePlanActive = (planId: string) => {
    setPlans(prev =>
      prev.map(p => (p.id === planId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleSendMessage = () => {
    if (!messagingUser || !customMsg.trim()) {
      alert('Please enter a notification message.');
      return;
    }
    alert(`Renewal reminder message sent successfully to ${messagingUser.companyName} (${messagingUser.email})!`);
    setMessagingUser(null);
    setCustomMsg('');
  };

  const filteredExpiringUsers = expiringUsers.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.companyName.toLowerCase().includes(q) ||
      u.ownerName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.currentPlan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4">

      {/* HEADER TITLE CARD */}
      <div className="page-header-card justify-between">
        <div>
          <h1 className="page-header-title">
            Subscriptions & Plans Management
          </h1>
          <p className="light-text mt-0.5">
            Super Admin Control: Configure plans, pricing, free perks, monitor expiring user accounts, and send renewal messages.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-black hover:bg-[#1f2937] text-white cursor-pointer shadow-xs font-outfit"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Subscription Plan</span>
        </button>
      </div>

      {/* METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Configured Plans</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{plans.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Active Subscriptions</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">48 Accounts</p>
        </div>

        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expiring Soon / Expired</span>
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-600">{expiringUsers.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Recurring Revenue</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">₹1,84,500 <span className="text-xs font-normal text-slate-400">/mo</span></p>
        </div>
      </div>

      {/* TAB NAVIGATION & SEARCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'PLANS'
                ? 'bg-black text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Manage Plans & Pricing ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPIRING')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'EXPIRING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Expiring Subscriptions & User Alerts ({expiringUsers.length})</span>
          </button>
        </div>

        {activeTab === 'EXPIRING' && (
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search expiring company..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
            />
          </div>
        )}
      </div>

      {/* TAB 1: PLANS & PRICING GRID */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative transition-all ${
                plan.isPopular ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>Most Popular</span>
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-slate-900 text-lg">{plan.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      plan.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-3xl font-black text-slate-900">
                    {plan.price}
                    <span className="text-xs font-semibold text-slate-400"> / month</span>
                  </div>
                </div>

                {/* Included Free Perks Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Free Offered Perks & Limits
                  </span>
                  {plan.freeTierPerks.map((perk, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Main Limits */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4 bg-slate-100/60 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">AI Voices</span>
                    <span className="font-black text-slate-800">{plan.maxVoices}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Campaigns</span>
                    <span className="font-black text-slate-800">{plan.maxCampaigns}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Max Calls</span>
                    <span className="font-black text-slate-800">{plan.maxCalls.toLocaleString()}</span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2 mb-6 text-xs text-slate-600">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleStartEdit(plan)}
                  className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Plan & Pricing</span>
                </button>

                <button
                  onClick={() => togglePlanActive(plan.id)}
                  className={`w-full py-2 font-bold text-xs rounded-xl border transition-all ${
                    plan.isActive
                      ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* TAB 2: EXPIRING SUBSCRIPTIONS & USER ALERTS */}
      {activeTab === 'EXPIRING' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center space-x-2 text-xs font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Users listed below have subscriptions expiring within 7 days or already expired. Click <strong>Send Message</strong> to alert them for plan renewal.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Company & Owner</th>
                  <th className="py-4 px-6">Contact Email & Phone</th>
                  <th className="py-4 px-6">Current Plan</th>
                  <th className="py-4 px-6">Expiration Date</th>
                  <th className="py-4 px-6">Status / Time Left</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpiringUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                      No expiring user subscriptions found.
                    </td>
                  </tr>
                ) : (
                  filteredExpiringUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Company & Owner */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.companyName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Owner: {user.ownerName}</p>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5 text-slate-600">
                          <p className="flex items-center space-x-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.email}</span>
                          </p>
                          <p className="flex items-center space-x-1 text-[11px] text-slate-500">
                            <span>{user.phone}</span>
                          </p>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-bold text-[11px]">
                          {user.currentPlan}
                        </span>
                      </td>

                      {/* Expiration Date */}
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {user.expiryDate}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {user.status === 'EXPIRING_SOON' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Expires in {user.daysRemaining} days</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                            <span>Expired ({Math.abs(user.daysRemaining)} days ago)</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setMessagingUser(user);
                            setCustomMsg(
                              `Hello ${user.ownerName}, your ${user.currentPlan} for ${user.companyName} is ${
                                user.daysRemaining < 0
                                  ? 'expired'
                                  : `expiring in ${user.daysRemaining} days`
                              }. Please renew your plan to ensure uninterrupted access to your AI campaigns.`
                            );
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm inline-flex items-center space-x-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Renewal Message</span>
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND RENEWAL MESSAGE MODAL */}
      {/* ========================================================================= */}
      {messagingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl font-sans relative text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Send Renewal Message</h3>
                  <p className="text-xs text-slate-500">{messagingUser.companyName}</p>
                </div>
              </div>
              <button
                onClick={() => setMessagingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                <p className="font-semibold text-slate-800">Recipient: <span className="font-normal">{messagingUser.ownerName} ({messagingUser.email})</span></p>
                <p className="font-semibold text-slate-800">Current Plan: <span className="font-normal">{messagingUser.currentPlan}</span></p>
                <p className="font-semibold text-amber-700">Expires: <span className="font-bold">{messagingUser.expiryDate}</span></p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Custom Renewal Notification Message *
                </label>
                <textarea
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  rows={4}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setMessagingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
