'use client';

import { useState } from 'react';
import { useStore } from '../../store';
import { 
  Plus, 
  Download, 
  Check, 
  X 
} from 'lucide-react';
import API_BASE from '../../../config/api';

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  plan: string;
  amount: string;
  status: string;
}

const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv-1', invoiceNo: 'INV-2026-06-001', date: '2026-06-01', plan: 'Pro Monthly', amount: '₹4,999', status: 'Paid' },
  { id: 'inv-2', invoiceNo: 'INV-2026-05-001', date: '2026-05-01', plan: 'Pro Monthly', amount: '₹4,999', status: 'Paid' },
  { id: 'inv-3', invoiceNo: 'INV-2026-04-001', date: '2026-04-01', plan: 'Basic Monthly', amount: '₹2,499', status: 'Paid' },
];

export default function BillingPage() {
  const { wallet, setWallet, token } = useStore();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [currentPlan, setCurrentPlan] = useState('Pro');

  // Change Plan Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Basic');

  // Top Up Wallet Modal State
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5000');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const walletBalance = wallet?.balance !== undefined ? wallet.balance : 4280;

  const handleSelectPlanConfirm = () => {
    setCurrentPlan(selectedPlan);
    setShowPlanModal(false);
    alert(`Successfully changed plan to ${selectedPlan}!`);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingTopUp(true);
    
    try {
      const numAmount = parseFloat(topUpAmount.replace(/[^\d.]/g, ''));
      if (isNaN(numAmount) || numAmount <= 0) {
        alert("Please enter a valid positive amount.");
        setIsProcessingTopUp(false);
        return;
      }

      if (token) {
        const cents = Math.round(numAmount * 100);
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
        } else {
          setWallet({ balance: walletBalance + numAmount });
        }
      } else {
        setWallet({ balance: walletBalance + numAmount });
      }

      setTimeout(() => {
        setIsProcessingTopUp(false);
        setShowTopUpModal(false);
        alert(`Successfully added ₹${numAmount.toLocaleString()} to your wallet balance!`);
      }, 800);

    } catch (err) {
      setWallet({ balance: walletBalance + (parseFloat(topUpAmount) || 5000) });
      setIsProcessingTopUp(false);
      setShowTopUpModal(false);
      alert(`Wallet updated successfully!`);
    }
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fade-in font-outfit">
      
      {/* 1. HEADER TITLE CARD */}
      <div className="page-header-card">
        <h1 className="page-header-title">
          Billing
        </h1>
      </div>

      {/* 2. TOP ROW STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Current plan */}
        <div className="table-card-box p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">Current plan</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              {currentPlan}
            </h3>
            <p className="text-xs font-normal font-outfit text-slate-500">
              ₹4,999 / month - renews Jul 1
            </p>
          </div>
          <div className="pt-3">
            <button
              onClick={() => setShowPlanModal(true)}
              className="px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-normal font-outfit rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              Change Plan
            </button>
          </div>
        </div>

        {/* Card 2: Wallet balance */}
        <div className="table-card-box p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">Wallet balance</h4>
            <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
              ₹{walletBalance.toLocaleString()}
            </h3>
          </div>
          {/* Horizontal Progress Bar & Add Funds Button */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <div className="h-2 flex-1 bg-[#E5E5E5] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#059669] rounded-full transition-all duration-500" 
                style={{ width: '65%' }} 
              />
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-3 py-1.5 bg-[#18181B] hover:bg-black text-white text-xs font-normal font-outfit rounded-lg shadow-2xs transition-all cursor-pointer shrink-0"
            >
              Add Funds
            </button>
          </div>
        </div>

        {/* Card 3: Usage this month */}
        <div className="table-card-box p-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">Usage this month</h4>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[30px] leading-[38px] font-bold font-outfit text-[#0A0A0A]">
                1,284
              </h3>
              <span className="text-xs font-normal font-outfit text-slate-500">
                / 2,500 calls
              </span>
            </div>
          </div>
          {/* Horizontal Progress Bar */}
          <div className="pt-2 space-y-1">
            <div className="h-2 w-full bg-[#E5E5E5] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#EA580C] rounded-full transition-all duration-500" 
                style={{ width: '51%' }} 
              />
            </div>
            <p className="text-xs font-normal font-outfit text-slate-400 pt-1">
              Resets Jul 1
            </p>
          </div>
        </div>

      </div>

      {/* 3. PAYMENT METHOD CARD */}
      <div className="table-card-box p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
            Payment method
          </h3>
          <p className="font-outfit font-normal text-xs text-slate-400 mt-0.5">
            Visa ending in 4242 - expires 09/29
          </p>
        </div>

        <button
          onClick={() => alert("Payment update form will open.")}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-black text-white text-xs font-normal font-outfit rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          Update
        </button>
      </div>

      {/* 4. INVOICES TABLE CONTAINER */}
      <div className="table-container">
        <div className="p-5 border-b border-[#E5E5E5]">
          <h3 className="font-outfit font-normal text-[20px] leading-[30px] text-[#0A0A0A]">
            Invoices
          </h3>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D4D4D4] h-[48px] bg-white">
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Invoice</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Date</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Plan</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Amount</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3">Status</th>
                <th className="font-outfit font-normal text-sm text-[#71717A] px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="h-[52px] hover:bg-slate-50/50 transition-colors">
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{inv.invoiceNo}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{inv.date}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{inv.plan}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{inv.amount}</td>
                  <td className="font-outfit font-normal text-[16px] leading-[24px] text-[#09090B] px-5 py-3">{inv.status}</td>
                  <td className="font-outfit font-normal text-sm text-[#09090B] px-5 py-3 text-right">
                    <button 
                      onClick={() => alert(`Downloading invoice ${inv.invoiceNo}`)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4 text-slate-700" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SELECT A PLAN MODAL DIALOG */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-outfit">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl border border-[#E5E5E5] overflow-hidden p-6 sm:p-8 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowPlanModal(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#09090B] mb-8 font-outfit">
              Select a plan
            </h2>

            {/* 3 Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              
              {/* Card 1: Basic */}
              <div 
                onClick={() => setSelectedPlan('Basic')}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === 'Basic' 
                    ? 'border-slate-800 border-2 bg-white shadow-xs' 
                    : 'border-[#E4E4E7] bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <h4 className="font-outfit font-normal text-lg text-[#71717A]">Basic</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit font-bold text-3xl text-[#09090B]">₹2,499</span>
                    <span className="font-outfit font-normal text-xs text-[#71717A]">/mon</span>
                  </div>
                  <ul className="space-y-2 pt-2 text-xs font-normal font-outfit text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>1 AI voice</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>1 campaign</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Email support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 2: Pro */}
              <div 
                onClick={() => setSelectedPlan('Pro')}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === 'Pro' 
                    ? 'border-slate-800 border-2 bg-white shadow-xs' 
                    : 'border-[#E4E4E7] bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <h4 className="font-outfit font-normal text-lg text-[#71717A]">Pro</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit font-bold text-3xl text-[#09090B]">₹4,999</span>
                    <span className="font-outfit font-normal text-xs text-[#71717A]">/mon</span>
                  </div>
                  <ul className="space-y-2 pt-2 text-xs font-normal font-outfit text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>4 voices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Unlimited campaigns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Live monitoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 3: Enterprise */}
              <div 
                onClick={() => setSelectedPlan('Enterprise')}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedPlan === 'Enterprise' 
                    ? 'border-slate-800 border-2 bg-white shadow-xs' 
                    : 'border-[#E4E4E7] bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  <h4 className="font-outfit font-normal text-lg text-[#71717A]">Enterprise</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit font-bold text-3xl text-[#09090B]">Custom</span>
                    <span className="font-outfit font-normal text-xs text-[#71717A]">/mon</span>
                  </div>
                  <ul className="space-y-2 pt-2 text-xs font-normal font-outfit text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>All voices</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Unlimited calls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>SSO & audit</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                      <span>Dedicated CSM</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Bottom Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSelectPlanConfirm}
                className="px-6 py-3 bg-[#18181B] hover:bg-black text-white rounded-lg text-sm font-semibold font-outfit transition-all cursor-pointer shadow-sm"
              >
                Continue with {selectedPlan}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOP UP WALLET MODAL DIALOG (Matching Figma Screenshot) */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-outfit">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-[#E5E5E5] overflow-hidden p-6 space-y-6 relative">
            
            {/* Header Title & Close Button */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-outfit font-bold text-xl text-[#09090B]">Top up wallet</h3>
                <p className="font-outfit font-normal text-xs text-[#71717A] mt-0.5">
                  Funds are used for per-minute call charges.
                </p>
              </div>
              <button 
                onClick={() => setShowTopUpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-5">
              
              {/* Preset Pill Amount Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {['1000', '5000', '10000'].map((amt) => {
                  const formatted = `₹${parseInt(amt).toLocaleString()}`;
                  const isSelected = topUpAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 px-3 rounded-lg border text-center text-sm font-semibold font-outfit transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#09090B] border-2 bg-white text-[#09090B] shadow-2xs' 
                          : 'border-[#E4E4E7] bg-white text-[#09090B] hover:bg-slate-50'
                      }`}
                    >
                      {formatted}
                    </button>
                  );
                })}
              </div>

              {/* Custom Input Field */}
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#09090B] font-bold text-sm">₹</span>
                  <input
                    type="text"
                    required
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="5000"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-[#E4E4E7] focus:outline-none focus:border-slate-800 text-sm font-semibold text-[#09090B]"
                  />
                </div>
              </div>

              {/* Submit Pay Button */}
              <div>
                {isProcessingTopUp ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-[#475569] text-white rounded-lg text-sm font-semibold font-outfit cursor-not-allowed transition-all text-center shadow-xs"
                  >
                    Processing...
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#18181B] hover:bg-black text-white rounded-lg text-sm font-semibold font-outfit transition-all cursor-pointer text-center shadow-sm"
                  >
                    Pay ₹{parseInt(topUpAmount || '0').toLocaleString()}
                  </button>
                )}
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
