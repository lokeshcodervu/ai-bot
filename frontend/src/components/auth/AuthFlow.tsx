'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../app/store';
import { Mail, Check, CreditCard, ShieldCheck, Lock, Smartphone, ArrowRight, X, Info, CheckCircle2, Sparkles } from 'lucide-react';
import API_BASE from '../../config/api';

interface AuthFlowProps {
  initialView?: 'login' | 'signup' | 'reset-password';
  isModal?: boolean;
  onClose?: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  initialView = 'signup',
  isModal = false,
  onClose,
}) => {
  const router = useRouter();
  const { setToken, setUser, setTenant } = useStore();

  // View state: 'login' | 'signup' | 'reset-password' | 'reset-success'
  const [view, setView] = useState<'login' | 'signup' | 'reset-password' | 'reset-success'>(initialView);

  // Step in signup: 1 (Form), 2 (Industry), 3 (Subscription Plan)
  const [step, setStep] = useState<number>(1);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Company Verification Form State
  const [country, setCountry] = useState<'India' | 'United Kingdom'>('India');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // OTP State (6 digits - default 111111)
  const [otpDigits, setOtpDigits] = useState<string[]>(['1', '1', '1', '1', '1', '1']);

  // Reset Password Email
  const [resetEmail, setResetEmail] = useState('');

  // Industry State
  const [selectedIndustry, setSelectedIndustry] = useState<string>('IT Training & Education');

  // Subscription Plan State
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('pro');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardName, setCardName] = useState('Lokesh Kumar');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [upiId, setUpiId] = useState('lokesh@upi');

  // Backend Tokens
  const [signupToken, setSignupToken] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [txnId, setTxnId] = useState('');

  const industries = [
    'IT Training & Education',
    'Real Estate',
    'Insurance',
    'Healthcare',
    'Financial Services',
    'E-commerce',
    'SaaS',
    'Other',
  ];

  const getPlanPrice = () => {
    if (selectedPlan === 'basic') return '₹2,499';
    if (selectedPlan === 'pro') return '₹4,999';
    return 'Custom';
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true',
        },
        body: new URLSearchParams({
          username: email.trim().toLowerCase(),
          password: password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        if (data.tenant) {
          setTenant(data.tenant);
        }
        if (onClose) onClose();
        router.push('/dashboard');
      } else {
        const err = await res.json();
        alert(`Login failed: ${err.detail || 'Invalid credentials'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup Step 1
  const handleSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert('Please agree to the terms of services.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          full_name: fullName.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSignupToken(data.signup_token);
        setShowVerifyModal(true);
      } else {
        const err = await res.json();
        let errMsg = 'Email already exists or invalid details';
        if (typeof err.detail === 'string') {
          errMsg = err.detail;
        } else if (Array.isArray(err.detail) && err.detail.length > 0) {
          errMsg = err.detail.map((d: any) => d.msg || 'Invalid field').join(', ');
        }
        alert(`Signup failed: ${errMsg}`);
      }
    } catch (err) {
      console.error(err);
      alert('Signup request failed. Ensure server is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      alert('Please enter all 6 digits of the verification code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          signup_token: signupToken,
          otp: fullOtp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVerifiedToken(data.verified_token);
        setShowVerifyModal(false);
        setStep(2);
      } else {
        const err = await res.json();
        alert(`Verification failed: ${err.detail || 'Invalid OTP code'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Verification request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // File Validation Helper (Allowed: .pdf, .jpg, .jpeg, .png; Max: 10MB)
  const handleFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setVerificationDoc(null);
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
      setFileError('Invalid file type. Allowed formats: PDF, JPG, JPEG, PNG.');
      setVerificationDoc(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size exceeds maximum allowed limit of 10 MB.');
      setVerificationDoc(null);
      return;
    }
    setVerificationDoc(file);
  };

  // Handle Step 2 Company Verification Submission
  const handleCompanyDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Please enter your Company Name.');
      return;
    }
    if (!registeredAddress.trim()) {
      alert('Please enter your Registered Office Address.');
      return;
    }
    if (country === 'United Kingdom' && !companyNumber.trim()) {
      alert('Please enter your Companies House Company Number.');
      return;
    }
    if (!verificationDoc) {
      alert('Please upload the required company verification document.');
      return;
    }

    setIsLoading(true);
    try {
      const activeToken = verifiedToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
      const formData = new FormData();
      formData.append('country', country);
      formData.append('company_name', companyName.trim());
      formData.append('company_email', companyEmail.trim() || email.trim());
      formData.append('company_phone', companyPhone.trim());
      formData.append('owner_name', ownerName.trim() || fullName.trim());
      formData.append('registered_address', registeredAddress.trim());
      if (country === 'United Kingdom') {
        formData.append('company_number', companyNumber.trim());
      }
      formData.append('verification_doc', verificationDoc);

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
        setTenant({
          id: data.tenant_id,
          companyName: companyName,
          country: country,
          companyEmail: companyEmail || email,
          companyPhone: companyPhone,
          companyNumber: companyNumber,
          registeredAddress: registeredAddress,
          ownerName: ownerName || fullName,
          verificationStatus: 'PENDING',
          verificationDocUrl: data.verification_doc_url,
        });
        if (onClose) onClose();
        router.push('/dashboard');
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.detail || 'Could not upload company document'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Document submission failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2 Industry Continue
  const handleIndustryContinue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/select-industry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          industry: selectedIndustry,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.verified_token) {
          setVerifiedToken(data.verified_token);
        }
      }
      setStep(3);
    } catch (err) {
      console.error(err);
      setStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 3 Plan Selection -> Open Payment Gateway Modal
  const handlePlanContinue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/select-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          plan: selectedPlan,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.verified_token) {
          setVerifiedToken(data.verified_token);
        }
      }
      setPaymentError(null);
      setShowPaymentModal(true);
    } catch (err) {
      console.error(err);
      setPaymentError(null);
      setShowPaymentModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Payment Gateway Submit & Complete Setup
  const handlePaymentSubmitAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPaymentError(null);

    // Frontend decline check for testing
    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard === '0000000000000000' || cardCvc === '000' || upiId.toLowerCase().includes('decline')) {
      setIsLoading(false);
      setPaymentError('Your card was refused by the issuer. Try a different method to continue.');
      return;
    }

    try {
      const completeRes = await fetch(`${API_BASE}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          verified_token: verifiedToken,
          plan: selectedPlan,
          payment_method: paymentMethod,
          card_number: cardNumber,
          card_cvc: cardCvc,
          upi_id: upiId,
        }),
      });

      if (completeRes.ok) {
        const data = await completeRes.json();
        setToken(data.access_token);
        if (data.user) setUser(data.user);
        if (data.tenant) setTenant(data.tenant);

        // Generate Transaction ID & Show Payment Success Modal UI
        const randomTxn = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;
        setTxnId(randomTxn);
        setShowPaymentModal(false);
        setPaymentSuccess(true);

        // Auto-redirect to dashboard after 2.5 seconds
        setTimeout(() => {
          if (onClose) onClose();
          router.push('/dashboard');
        }, 2500);
        return;
      } else {
        const err = await completeRes.json();
        setPaymentError(err.detail || 'Your card was refused by the issuer. Try a different method to continue.');
      }
    } catch (err) {
      console.error(err);
      setPaymentError('Payment failed due to network connectivity issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      alert('Please enter your email.');
      return;
    }
    setView('reset-success');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#060607] text-white flex flex-col justify-between p-6 md:p-12 font-sans overflow-hidden selection:bg-emerald-500 selection:text-black">

      {/* Full Page Canvas Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-right bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: "url('/login.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#060607]/90 via-[#060607]/40 to-transparent z-0 pointer-events-none" />

      {/* Top Header Row */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-end mb-6 z-10 min-h-[40px]">
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 text-sm bg-black/40 rounded-lg backdrop-blur-md"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Main Content Area Overlaid on Background */}
      <div className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 py-4">

        {/* Left Side Form Column positioned over dark left space of background */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">

          {/* ========================================================================= */}
          {/* VIEW: SIGN UP */}
          {/* ========================================================================= */}
          {view === 'signup' && (
            <>
              {/* STEP 1: Sign up for free */}
              {step === 1 && (
                <div className="space-y-6">
                  <h1
                    className="text-white mb-2"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 400,
                      fontSize: '36px',
                      lineHeight: '44px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Sign up for free
                  </h1>

                  <form onSubmit={handleSignupStep1} className="space-y-4 font-sans">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        className="w-full bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Work email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        className="w-full bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="**********"
                        required
                        className="w-full bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id="agree"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 rounded bg-[#121214] border-zinc-700 text-zinc-200 focus:ring-0"
                      />
                      <label htmlFor="agree" className="text-xs text-zinc-400">
                        I agree to the terms of services*
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282C] text-white font-medium text-sm rounded-xl transition-all shadow-lg border border-zinc-700/50 disabled:opacity-50 mt-2"
                    >
                      {isLoading ? 'Creating account...' : 'Create account'}
                    </button>

                    <div className="flex items-center space-x-4 my-3 text-zinc-600 text-xs">
                      <div className="flex-1 h-[1px] bg-zinc-800" />
                      <span>or</span>
                      <div className="flex-1 h-[1px] bg-zinc-800" />
                    </div>

                    <button
                      type="button"
                      onClick={() => alert('Google Sign-up configured.')}
                      className="w-full py-3 bg-[#121214]/90 border border-[#26262A] hover:bg-[#1C1C1E] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center space-x-3 backdrop-blur-md"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                        />
                      </svg>
                      <span>Sign up with Google</span>
                    </button>
                  </form>

                  <div className="pt-2 text-center text-xs text-zinc-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => setView('login')}
                      className="text-white font-medium hover:underline"
                    >
                      Log in here
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Company Verification Form */}
              {step === 2 && (
                <form onSubmit={handleCompanyDocSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <h1
                      className="text-white mb-1"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 400,
                        fontSize: '32px',
                        lineHeight: '40px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Company Verification
                    </h1>
                    <p className="text-xs text-zinc-400">
                      Provide company details and verification documents for account review.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Country Selection */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Company Country *
                      </label>
                      <select
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value as 'India' | 'United Kingdom');
                          setVerificationDoc(null);
                          setFileError(null);
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        <option value="India">India</option>
                        <option value="United Kingdom">United Kingdom</option>
                      </select>
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={country === 'United Kingdom' ? "e.g. CoderVu Ltd" : "e.g. CoderVu Technologies Pvt Ltd"}
                        className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Company Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={companyEmail || email}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          placeholder="company@codervu.com"
                          className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder={country === 'United Kingdom' ? "+44 20 7946 0912" : "+91 98765 43210"}
                          className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>

                    {/* Owner Name */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Owner Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName || fullName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    {/* UK Specific Company Number */}
                    {country === 'United Kingdom' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1">
                          Company Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyNumber}
                          onChange={(e) => setCompanyNumber(e.target.value)}
                          placeholder="Enter Company Number (e.g. 12345678)"
                          className="w-full px-3.5 py-2.5 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    )}

                    {/* Registered Office Address */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Registered Office Address *
                      </label>
                      <textarea
                        required
                        value={registeredAddress}
                        onChange={(e) => setRegisteredAddress(e.target.value)}
                        placeholder="Enter complete registered office address"
                        rows={2}
                        className="w-full px-3.5 py-2 bg-[#121214] border border-[#26262A] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-500 resize-none"
                      />
                    </div>

                    {/* Document Upload Section */}
                    <div className="p-3.5 bg-[#121214]/80 border border-[#26262A] rounded-xl space-y-2">
                      <label className="block text-xs font-semibold text-white">
                        Company Verification Documents *
                      </label>

                      {country === 'India' ? (
                        <p className="text-[11px] text-zinc-400">
                          Required: <strong>GST Registration Certificate</strong> OR <strong>Certificate of Incorporation / Company Registration Certificate</strong>
                        </p>
                      ) : (
                        <p className="text-[11px] text-zinc-400">
                          Required: <strong>Companies House Certificate of Incorporation</strong>
                        </p>
                      )}

                      <input
                        type="file"
                        required
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
                      />

                      {fileError && (
                        <p className="text-[11px] text-red-400 mt-1 font-medium">
                          ⚠️ {fileError}
                        </p>
                      )}

                      {verificationDoc && !fileError && (
                        <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                          ✓ File Selected: {verificationDoc.name} ({Math.round(verificationDoc.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !!fileError || !verificationDoc}
                      className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 mt-2"
                    >
                      {isLoading ? 'Submitting Verification...' : 'Submit for Verification'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Select a plan */}
              {step === 3 && (
                <div className="space-y-6 max-w-xl">
                  <h1
                    className="text-white mb-4"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 400,
                      fontSize: '36px',
                      lineHeight: '44px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Select a plan
                  </h1>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Basic Plan */}
                    <div
                      onClick={() => setSelectedPlan('basic')}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all ${selectedPlan === 'basic'
                        ? 'bg-[#141415] border-zinc-400 text-white ring-1 ring-zinc-400'
                        : 'bg-[#121214]/70 backdrop-blur-md border-[#26262A] text-zinc-400 hover:border-zinc-700'
                        }`}
                    >
                      <h3 className="text-sm font-medium text-white mb-1">Basic</h3>
                      <div className="text-xl md:text-2xl font-bold text-white mb-4">
                        ₹2,499<span className="text-xs font-normal text-zinc-400">/mon</span>
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>1 AI voice</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>1 campaign</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Email support</span>
                        </li>
                      </ul>
                    </div>

                    {/* Pro Plan */}
                    <div
                      onClick={() => setSelectedPlan('pro')}
                      className={`cursor-pointer p-5 rounded-2xl border transition-all ${selectedPlan === 'pro'
                        ? 'bg-[#141415] border-zinc-400 text-white ring-1 ring-zinc-400'
                        : 'bg-[#121214]/70 backdrop-blur-md border-[#26262A] text-zinc-400 hover:border-zinc-700'
                        }`}
                    >
                      <h3 className="text-sm font-medium text-white mb-1">Pro</h3>
                      <div className="text-xl md:text-2xl font-bold text-white mb-4">
                        ₹4,999<span className="text-xs font-normal text-zinc-400">/mon</span>
                      </div>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>4 voices</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Unlimited campaigns</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Live monitoring</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-emerald-400">✓</span>
                          <span>Priority support</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Enterprise Plan */}
                  <div
                    onClick={() => setSelectedPlan('enterprise')}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${selectedPlan === 'enterprise'
                      ? 'bg-[#141415] border-zinc-400 text-white ring-1 ring-zinc-400'
                      : 'bg-[#121214]/70 backdrop-blur-md border-[#26262A] text-zinc-400 hover:border-zinc-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-white mb-0.5">Enterprise</h3>
                        <div className="text-xl font-bold text-white">
                          Custom<span className="text-xs font-normal text-zinc-400">/mon</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-300">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400">✓</span>
                        <span>All voices</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Custom integrations</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Unlimited calls</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400">✓</span>
                        <span>SSO & audit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400">✓</span>
                        <span>Dedicated CSM</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlanContinue}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282C] text-white font-medium text-sm rounded-xl transition-all shadow-md disabled:opacity-50 border border-zinc-700/50 mt-4 flex items-center justify-center space-x-2 group"
                  >
                    <span>{`Continue with ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} (${getPlanPrice()})`}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* VIEW: LOG IN */}
          {/* ========================================================================= */}
          {view === 'login' && (
            <div className="space-y-6">
              <h1
                className="text-white mb-2"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 400,
                  fontSize: '36px',
                  lineHeight: '44px',
                  letterSpacing: '-0.02em',
                }}
              >
                Log In
              </h1>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="**********"
                    required
                    className="w-full bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#121214] border-zinc-700 text-zinc-200 focus:ring-0"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setView('reset-password')}
                    className="text-zinc-300 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282C] text-white font-medium text-sm rounded-xl transition-all shadow-md disabled:opacity-50 border border-zinc-700/50 mt-2"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="flex items-center space-x-4 my-3 text-zinc-600 text-xs">
                  <div className="flex-1 h-[1px] bg-zinc-800" />
                  <span>or</span>
                  <div className="flex-1 h-[1px] bg-zinc-800" />
                </div>

                <button
                  type="button"
                  onClick={() => alert('Google Sign-in configured.')}
                  className="w-full py-3 bg-[#121214]/90 border border-[#26262A] hover:bg-[#1C1C1E] text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center space-x-3 backdrop-blur-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-zinc-400">
                Need an account?{' '}
                <button
                  onClick={() => {
                    setView('signup');
                    setStep(1);
                  }}
                  className="text-white font-medium hover:underline"
                >
                  Create account
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW: RESET PASSWORD */}
          {/* ========================================================================= */}
          {view === 'reset-password' && (
            <div className="bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-2xl p-8 max-w-md w-full space-y-6">
              <div>
                <h1
                  className="text-white mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 400,
                    fontSize: '36px',
                    lineHeight: '44px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Reset your password
                </h1>
                <p className="text-xs text-zinc-400">We&apos;ll email you a reset link.</p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full bg-[#121214] border border-[#26262A] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282C] text-white font-medium text-sm rounded-xl transition-all shadow-md border border-zinc-700/50"
                >
                  Send reset link
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => setView('login')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {/* VIEW: RESET PASSWORD SUCCESS */}
          {view === 'reset-success' && (
            <div className="bg-[#121214]/90 backdrop-blur-md border border-[#26262A] rounded-2xl p-8 max-w-md w-full text-center space-y-6">
              <div>
                <h1
                  className="text-white mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 400,
                    fontSize: '36px',
                    lineHeight: '44px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Reset your password
                </h1>
                <p className="text-xs text-zinc-400">We&apos;ll email you a reset link.</p>
              </div>

              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto my-4">
                <Check className="w-7 h-7" />
              </div>

              <p className="text-xs text-zinc-300">Check your inbox for the reset link.</p>

              <div>
                <button
                  onClick={() => setView('login')}
                  className="text-xs font-medium text-white hover:underline transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Footer Support Email */}
      <div className="w-full max-w-7xl mx-auto flex items-center text-xs text-zinc-500 z-10 pt-4 font-sans">
        <div className="flex items-center space-x-2">
          <Mail className="w-3.5 h-3.5" />
          <span>help@salesAI.com</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL OVERLAY: VERIFY EMAIL (OTP CODE) */}
      {/* ========================================================================= */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0F] border border-[#26262A] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl font-sans">
            <div>
              <h2 className="text-2xl font-normal tracking-tight text-white mb-1.5 font-sans">
                Verify your email
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                We sent a 6-digit code to <span className="text-zinc-200">{email || 'yash@gmail.com'}</span>
              </p>
            </div>

            {/* 6 OTP Input Boxes */}
            <div className="flex items-center justify-center space-x-2 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-10 h-12 text-center text-xl font-bold bg-[#141415] border border-[#26262A] rounded-xl text-white focus:outline-none focus:border-zinc-400 transition-colors"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1C1C1E] hover:bg-[#28282C] text-white font-medium text-sm rounded-xl transition-all shadow-md disabled:opacity-50 border border-zinc-700/50"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-xs text-zinc-500">
              Didn&apos;t get it?{' '}
              <button
                type="button"
                onClick={() => alert('Verification code resent to your email.')}
                className="text-white font-medium hover:underline"
              >
                Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OVERLAY: PAYMENT GATEWAY (CARD & UPI PAYMENT) */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0D0F] border border-[#26262A] rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl font-sans relative text-left">

            {/* Modal Header & Close */}
            <div className="flex items-center justify-between pb-2 border-b border-[#26262A]">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Checkout & Payment</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Complete your workspace subscription</p>
              </div>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentError(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#1A1A1D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plan Summary Badge */}
            <div className="bg-[#141416] border border-[#26262A] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Plan Selected</span>
                <span className="text-base font-bold text-white capitalize">{selectedPlan} Plan</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-emerald-400">{getPlanPrice()}</span>
                <span className="text-xs text-zinc-400 block">/ month</span>
              </div>
            </div>

            {/* ERROR / DECLINED ALERT BANNER (Matches Figma Screenshot 100%) */}
            {paymentError && (
              <div className="bg-[#1A0B0B] border border-red-500/60 rounded-2xl p-4 flex items-start space-x-3 text-left">
                <div className="w-7 h-7 rounded-full border border-red-500/80 flex items-center justify-center text-red-500 flex-shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-medium text-red-500 font-sans tracking-tight">Payment declined</h4>
                  <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                    {paymentError}
                  </p>
                </div>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#141416] border border-[#26262A] rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setPaymentError(null);
                }}
                className={`py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all ${paymentMethod === 'card'
                  ? 'bg-[#1C1C1E] text-white shadow-md border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('upi');
                  setPaymentError(null);
                }}
                className={`py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all ${paymentMethod === 'upi'
                  ? 'bg-[#1C1C1E] text-white shadow-md border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI Payment</span>
              </button>
            </div>

            {/* Form Fields according to selected Payment Method */}
            <form onSubmit={handlePaymentSubmitAndComplete} className="space-y-4">

              {/* CARD PAYMENT FORM */}
              {paymentMethod === 'card' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      required
                      placeholder="Name on card"
                      className="w-full bg-[#141416] border border-[#26262A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        placeholder="4242 4242 4242 4242 (Use 0000 0000 0000 0000 to test decline)"
                        className="w-full bg-[#141416] border border-[#26262A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors pr-10 font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        required
                        placeholder="MM/YY"
                        className="w-full bg-[#141416] border border-[#26262A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors text-center font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        required
                        placeholder="123 (Use 000 to test decline)"
                        className="w-full bg-[#141416] border border-[#26262A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI PAYMENT FORM */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Enter Virtual Payment Address (VPA / UPI ID)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      required
                      placeholder="mobile-number@upi (Use decline@upi to test decline)"
                      className="w-full bg-[#141416] border border-[#26262A] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors font-mono"
                    />
                  </div>

                  {/* Supported Apps Badges */}
                  <div>
                    <span className="block text-[11px] text-zinc-500 mb-2">Supported Apps</span>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-zinc-300">Google Pay</span>
                      <span className="px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-zinc-300">PhonePe</span>
                      <span className="px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-zinc-300">Paytm</span>
                      <span className="px-3 py-1 bg-[#18181B] border border-[#27272A] rounded-lg text-xs text-zinc-300">BHIM</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Footer Note */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-[#26262A]">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <span>PCI-DSS Compliant</span>
              </div>

              {/* Submit Payment Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
              >
                <span>{isLoading ? 'Processing Payment...' : `Pay ${getPlanPrice()} & Activate Subscription`}</span>
                <Check className="w-4 h-4" />
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OVERLAY: PAYMENT SUCCESSFUL CONFIRMATION SCREEN */}
      {/* ========================================================================= */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0D0D0F] border border-emerald-500/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl font-sans relative overflow-hidden">
            {/* Background Emerald Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Animated Success Check Circle */}
            <div className="relative z-10 w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/60 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {/* Success Title & Message */}
            <div className="relative z-10 space-y-1">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Payment Successful! 🎉
              </h2>
              <p className="text-xs text-zinc-400">
                Your workspace <span className="text-zinc-200 font-medium">AI-BOT</span> has been activated.
              </p>
            </div>

            {/* Receipt / Order Summary Card */}
            <div className="relative z-10 bg-[#141416] border border-[#26262A] rounded-2xl p-4 text-left space-y-2.5 text-xs font-sans">
              <div className="flex items-center justify-between pb-2 border-b border-[#26262A]">
                <span className="text-zinc-400">Transaction ID</span>
                <span className="text-zinc-200 font-mono font-medium">{txnId || 'TXN-89472910'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Plan Activated</span>
                <span className="text-emerald-400 font-semibold uppercase">{selectedPlan} Plan</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Amount Paid</span>
                <span className="text-white font-bold">{getPlanPrice()}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-zinc-400">Status</span>
                <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Paid & Active</span>
                </span>
              </div>
            </div>

            {/* Action Button & Auto-redirect notification */}
            <div className="relative z-10 space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  router.push('/dashboard');
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 group"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[11px] text-zinc-500 flex items-center justify-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Redirecting automatically in 2 seconds...</span>
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
