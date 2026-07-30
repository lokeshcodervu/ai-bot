'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../app/store';
import { X, Bot } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'signin', onClose }) => {
  const router = useRouter();
  const { setToken, setUser, setTenant } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
    industry: 'Insurance',
    plan: 'pro'
  });

  const [signupToken, setSignupToken] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [paymentId, setPaymentId] = useState('');

  if (!isOpen) return null;

  // 1. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true'
        },
        body: new URLSearchParams({
          username: loginEmail,
          password: loginPassword
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        if (data.tenant) {
          setTenant(data.tenant);
        }
        onClose();
        router.push('/dashboard');
      } else {
        const err = await res.json();
        alert(`Sign in failed: ${err.detail || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Sign in request error. Ensure backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Signup Step 1
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSignupToken(data.signup_token);
        setFormData(prev => ({ ...prev, username: data.user.username }));
        setStep(2);
      } else {
        const err = await res.json();
        alert(`Signup failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Signup request error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          signup_token: signupToken,
          otp: formData.otp
        })
      });
      if (res.ok) {
        const data = await res.json();
        setVerifiedToken(data.verified_token);
        setStep(3);
      } else {
        const err = await res.json();
        alert(`OTP verification failed: ${err.detail || 'Invalid code'}`);
      }
    } catch (err) {
      console.error(err);
      alert('OTP verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Select Industry
  const handleSelectIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/select-industry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          industry: formData.industry
        })
      });
      if (res.ok) {
        setStep(4);
      } else {
        const err = await res.json();
        alert(`Industry setup failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Industry selection error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Select Plan
  const handleSelectPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/select-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          plan: formData.plan
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentId(data.payment_id);
        setStep(5);
      } else {
        const err = await res.json();
        alert(`Plan selection failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Plan selection error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Verify Payment
  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          payment_id: paymentId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        setTenant(data.tenant);
        onClose();
        router.push('/dashboard');
      } else {
        const err = await res.json();
        alert(`Payment activation failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Payment activation error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-extrabold text-slate-900">TeleBot</span>
              <span className="text-lg font-extrabold text-blue-600">AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Autonomous Telephony Workspace</p>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
          <button
            onClick={() => { setMode('signin'); setStep(1); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In Existing
          </button>
          <button
            onClick={() => { setMode('signup'); setStep(1); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Onboard New Tenant
          </button>
        </div>

        {/* Mode 1: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* Mode 2: SIGN UP ONBOARDING FLOW */}
        {mode === 'signup' && (
          <div>
            {step === 1 && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="text-xs text-blue-600 font-mono font-bold mb-2">STEP 1 OF 5: ACCOUNT SIGNUP</div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@company.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Account...' : 'Continue to OTP Verification'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-xs text-blue-600 font-mono font-bold mb-2">STEP 2 OF 5: VERIFY OTP CODE</div>
                <p className="text-xs text-slate-600">Enter verification code sent to {formData.email} (Demo: <strong>123456</strong>)</p>
                <div>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-center text-lg tracking-widest focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Setup Tenant'}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleSelectIndustry} className="space-y-4">
                <div className="text-xs text-blue-600 font-mono font-bold mb-2">STEP 3 OF 5: SELECT INDUSTRY</div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization Industry Domain</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  >
                    <option value="Insurance">Insurance & Claims Operations</option>
                    <option value="Banking & Finance">Banking & Financial Services</option>
                    <option value="Healthcare">Healthcare & Counseling</option>
                    <option value="Real Estate">Real Estate Lead Dialing</option>
                    <option value="SaaS & Tech">Enterprise Software / SaaS</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                >
                  {isLoading ? 'Setting Up Tenant...' : 'Initialize Tenant Workspace'}
                </button>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={handleSelectPlan} className="space-y-4">
                <div className="text-xs text-blue-600 font-mono font-bold mb-2">STEP 4 OF 5: SELECT PLAN</div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, plan: 'basic' })}
                    className={`p-4 rounded-xl border cursor-pointer ${
                      formData.plan === 'basic' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">Basic Starter</div>
                    <div className="text-xs text-blue-600 font-mono font-bold mt-1">$49 / mo</div>
                    <div className="text-[10px] text-slate-500 mt-1">1,000 Call Mins</div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, plan: 'pro' })}
                    className={`p-4 rounded-xl border cursor-pointer ${
                      formData.plan === 'pro' ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-sm font-bold text-slate-900">Pro Enterprise</div>
                    <div className="text-xs text-blue-600 font-mono font-bold mt-1">$199 / mo</div>
                    <div className="text-[10px] text-slate-500 mt-1">5,000 Mins + Document KB</div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
                >
                  {isLoading ? 'Creating Subscription...' : 'Proceed to Activation'}
                </button>
              </form>
            )}

            {step === 5 && (
              <form onSubmit={handleVerifyPayment} className="space-y-4 text-center">
                <div className="text-xs text-blue-600 font-mono font-bold mb-2">STEP 5 OF 5: ACTIVATION</div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Plan Selected:</span>
                    <strong className="text-slate-900 uppercase">{formData.plan}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Payment ID:</span>
                    <span className="font-mono text-blue-600">{paymentId || 'MOCK_PAY_9821'}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Wallet Balance:</span>
                    <span className="text-emerald-600 font-bold">$0.00 (Ready)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
                >
                  {isLoading ? 'Activating Workspace...' : 'Activate & Enter Dashboard'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
