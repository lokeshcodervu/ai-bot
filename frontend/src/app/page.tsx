'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './store';
import { ShieldCheck, CreditCard, ChevronRight, ArrowRight, Sparkles, Key } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

export default function OnboardingPage() {
  const router = useRouter();
  const { token, setToken, setUser, setTenant, tenant } = useStore();

  useEffect(() => {
    if (token && tenant && tenant.isPaymentDone === true) {
      router.push('/dashboard');
    }
  }, [token, tenant, router]);

  const [isLoginMode, setIsLoginMode] = useState<boolean>(true); // Default to login mode for quick testing
  const [step, setStep] = useState<number>(1); // 1: Signup, 2: OTP, 3: Industry, 4: Plan, 5: Payment
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
    industry: 'Insurance',
    plan: 'pro'
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sign In States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Onboarding session tokens
  const [signupToken, setSignupToken] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // 1. Submit Signup
  const handleSignup = async (e: React.FormEvent) => {
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
        setStep(2); // Go to OTP verification
      } else {
        const err = await res.json();
        alert(`Signup failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Signup error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP
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
        setStep(3); // Go to Industry selection
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

  // 3. Select Industry
  const handleSelectIndustry = async (industry: string) => {
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
          industry: industry
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(null);
        setTenant({
          companyName: '',
          website: '',
          timezone: 'Asia/Kolkata',
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          systemPrompt: '',
          systemPromptVersion: 1,
          isAiReady: true,
          isPaymentDone: false
        });
        setToken(data.access_token);
        setFormData(prev => ({ ...prev, industry }));
        setStep(4); // Go to Plan selection
      } else {
        const err = await res.json();
        alert(`Failed to save industry: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Select industry error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Select Subscription Plan
  const handleSelectPlan = async (plan: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/select-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          plan_id: plan
        })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, plan }));

        // Call create-payment immediately to initialize payment status
        const payRes = await fetch(`${API_BASE}/onboarding/create-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            gateway: 'MOCK'
          })
        });

        if (payRes.ok) {
          const payData = await payRes.json();
          setPaymentId(payData.payment_id);
          setStep(5); // Go to mock payment summary page
        } else {
          const payErr = await payRes.json();
          alert(`Failed to initialize payment: ${payErr.detail || 'Error'}`);
        }
      } else {
        const err = await res.json();
        alert(`Failed to select plan: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Select plan error.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Complete Mock Payment Verification
  const handleMockPayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/onboarding/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          payment_id: paymentId,
          gateway_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
          gateway_signature: `sig_${Math.random().toString(36).substr(2, 9)}`
        })
      });

      if (res.ok) {
        // Payment verified successfully. Fetch dashboard to set user & tenant
        const dashRes = await fetch(`${API_BASE}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setUser(dashData.user);
          setTenant({
            companyName: dashData.tenant.company_name,
            website: '',
            timezone: 'Asia/Kolkata',
            voiceId: '21m00Tcm4TlvDq8ikWAM',
            systemPrompt: '',
            systemPromptVersion: 1,
            isAiReady: true,
            isPaymentDone: true
          });
          alert('Payment verified and workspace activated!');
          router.push('/dashboard');
        } else {
          alert('Failed to retrieve dashboard details after activation.');
        }
      } else {
        const err = await res.json();
        alert(`Payment verification failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Payment verification error.');
    } finally {
      setIsLoading(false);
    }
  };

  // API Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true'
        },
        body: `username=${encodeURIComponent(loginEmail)}&password=${encodeURIComponent(loginPassword)}`
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const apiToken = loginData.access_token;

        // Fetch dashboard to get user and tenant details
        const dashRes = await fetch(`${API_BASE}/dashboard`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (dashRes.ok || dashRes.status === 402) {
          // If 402 Payment Required, they still successfully authenticated, let's load user/tenant
          let dashData;
          if (dashRes.status === 402) {
            // Let's fallback to manual profile retrieval if dashboard returns 402
            const [profileRes, meRes] = await Promise.all([
              fetch(`${API_BASE}/tenant/profile`, {
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'ngrok-skip-browser-warning': 'true'
                }
              }),
              fetch(`${API_BASE}/users/me`, {
                headers: {
                  'Authorization': `Bearer ${apiToken}`,
                  'ngrok-skip-browser-warning': 'true'
                }
              })
            ]);

            if (profileRes.ok && meRes.ok) {
              const profileData = await profileRes.json();
              const meData = await meRes.json();

              dashData = {
                user: {
                  username: meData.username,
                  email: meData.email,
                  role: meData.role,
                  full_name: meData.full_name
                },
                tenant: {
                  company_name: profileData.company_name,
                  is_payment_done: profileData.is_payment_done
                }
              };
            }
          } else {
            dashData = await dashRes.json();
          }

          if (dashData) {
            setToken(apiToken);
            setUser(dashData.user);
            setTenant({
              companyName: dashData.tenant.company_name,
              website: '',
              timezone: 'Asia/Kolkata',
              voiceId: '21m00Tcm4TlvDq8ikWAM',
              systemPrompt: '',
              systemPromptVersion: 1,
              isAiReady: true,
              isPaymentDone: dashData.tenant.is_payment_done
            });

            if (dashData.tenant.is_payment_done === false) {
              setIsLoginMode(false);
              setStep(4);
            } else {
              router.push('/dashboard');
            }
          } else {
            alert('Could not retrieve user/workspace profile from server.');
          }
        } else {
          const errData = await dashRes.json();
          alert(`Dashboard load failed: ${errData.detail || 'Error'}`);
        }
      } else {
        const errData = await loginRes.json();
        alert(`Login failed: ${errData.detail || 'Incorrect username or password'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Login error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 text-slate-900 bg-white">

      {/* LEFT COLUMN: FORMS AND STEPS */}
      <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 min-h-screen w-full">

        {/* Top Header Row */}
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-black" />
            <span className="font-extrabold font-outfit text-xl tracking-tight text-slate-900">SalesAI</span>
          </div>

          {/* Step Progress Info */}
          {!isLoginMode && (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              Step {step} of 5
            </span>
          )}
        </div>

        {/* Centered Form Area */}
        <div className="my-auto max-w-sm w-full mx-auto py-8">

          {/* IS LOGIN MODE */}
          {isLoginMode ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <h1 className="text-2xl font-extrabold font-outfit text-slate-900 tracking-tight">Sign in to your account</h1>
                <p className="text-xs text-slate-450 font-semibold mt-1">Welcome back! Access your outbound calling workspace.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username or Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="test@gmail.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-black hover:bg-[#1f2937] transition-colors disabled:bg-slate-200 cursor-pointer shadow-sm"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToken(null);
                    setUser(null);
                    setTenant({
                      companyName: '',
                      website: '',
                      timezone: 'Asia/Kolkata',
                      voiceId: '21m00Tcm4TlvDq8ikWAM',
                      systemPrompt: '',
                      systemPromptVersion: 1,
                      isAiReady: true,
                      isPaymentDone: false
                    });
                    setIsLoginMode(false);
                    setStep(1);
                  }}
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-black hover:underline cursor-pointer"
                >
                  Need to create a new workspace? Sign Up instead
                </button>
              </div>
            </form>
          ) : (
            /* IS REGISTER FLOW */
            <>
              {/* STEP 1: SIGNUP */}
              {step === 1 && (
                <form className="space-y-5" onSubmit={handleSignup}>
                  <div>
                    <h1 className="text-2xl font-extrabold font-outfit text-slate-900 tracking-tight">Sign up for free</h1>
                    <p className="text-xs text-slate-405 font-semibold mt-1 font-medium">Get started in seconds — no credit card required.</p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full name</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Work email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="**********"
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      required
                      id="terms"
                      className="rounded border-slate-300 text-black focus:ring-black h-4 w-4"
                    />
                    <label htmlFor="terms" className="text-xs font-semibold text-slate-500 cursor-pointer">
                      I agree to the terms of services*
                    </label>
                  </div>

                  <div className="space-y-4 pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-black hover:bg-[#1f2937] transition-colors disabled:bg-slate-200 cursor-pointer shadow-sm"
                    >
                      {isLoading ? 'Creating Account...' : 'Create account'}
                    </button>

                    <div className="relative flex items-center justify-center my-3 shrink-0">
                      <div className="w-full border-t border-slate-200"></div>
                      <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert("Google Sign-In integration is simulated.")}
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.92,-1.78 3.02,-4.4 3.02,-7.48c0,-0.65 -0.06,-1.27 -0.16,-1.88z" fill="#4285F4" />
                          <path d="M12,20.5c2.3,0 4.22,-0.76 5.63,-2.06l-3.29,-2.56c-0.91,0.61 -2.08,0.97 -3.29,0.97c-2.22,0 -4.11,-1.5 -4.78,-3.5H3.1v2.64A8.5,8.5 0 0,0 12,20.5z" fill="#34A853" />
                          <path d="M7.22,13.35c-0.17,-0.5 -0.27,-1.04 -0.27,-1.6c0,-0.56 0.1,-1.1 0.27,-1.6V7.5H3.1a8.5,8.5 0 0,0 0,8.5l4.12,-2.65z" fill="#FBBC05" />
                          <path d="M12,6.75c1.25,0 2.37,0.43 3.25,1.27l2.43,-2.43A8.48,8.48 0 0,0 12,3.5c-5.46,0 -9.18,3.58 -9.18,3.58l4.12,2.65c0.67,-2.02 2.56,-3.52 4.78,-3.52z" fill="#EA4335" />
                        </g>
                      </svg>
                      Sign up with Google
                    </button>

                    <p className="text-center text-xs font-semibold text-slate-500">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsLoginMode(true)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Log in here
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {step === 2 && (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div className="text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-slate-700" />
                    <h3 className="mt-2 text-lg font-bold font-outfit text-slate-900">Enter Verification Code</h3>
                    <p className="mt-2 text-xs text-slate-500 font-semibold leading-relaxed">
                      Verification code has been sent to <strong>{formData.email}</strong>. Use static code <strong>0000</strong> for testing.
                    </p>
                  </div>

                  <div>
                    <label className="block text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">4-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      placeholder="0 0 0 0"
                      className="w-full text-center px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-black text-lg font-mono tracking-widest font-bold bg-slate-50/50"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-2.5 px-4 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-2/3 py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-black hover:bg-[#1f2937] disabled:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SELECT INDUSTRY */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-extrabold font-outfit text-slate-900 tracking-tight text-center">Select Your Vertical</h3>
                    <p className="text-xs text-slate-400 font-semibold text-center mt-1">Loads vertical-specific baseline agent instructions.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {['Insurance', 'Real Estate', 'E-Learning (Ed-Tech)', 'SaaS & Enterprise IT'].map((ind) => (
                      <button
                        key={ind}
                        disabled={isLoading}
                        onClick={() => handleSelectIndustry(ind)}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-black hover:bg-slate-50/50 text-left transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{ind}</p>
                          <p className="text-xs text-slate-500">Loads vertical baseline voice prompting</p>
                        </div>
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: SELECT PLAN */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xl font-extrabold font-outfit text-slate-900 tracking-tight text-center">Choose Subscription Plan</h3>
                    <p className="text-xs text-slate-400 font-semibold text-center mt-1">Select the subscription limit that meets your target scale.</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'basic', name: 'Basic Plan', price: '$29/mo', desc: 'Up to 5 agents, 1,000 monthly minutes.' },
                      { id: 'pro', name: 'Pro Plan', price: '$79/mo', desc: 'Up to 15 agents, 5,000 mins + Advanced RAG.' },
                      { id: 'enterprise', name: 'Enterprise Plan', price: '$249/mo', desc: 'Unlimited concurrency, custom voices.' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        disabled={isLoading}
                        onClick={() => handleSelectPlan(p.id)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-black hover:bg-slate-50/50 text-left transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{p.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">{p.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: PAYMENT GATEWAY */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <CreditCard className="mx-auto h-12 w-12 text-slate-700" />
                    <h3 className="mt-2 text-lg font-bold font-outfit text-slate-900">Secure Payment Simulation</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      You are subscribing to the <strong className="text-slate-700">{formData.plan.toUpperCase()}</strong> plan.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Plan Rate:</span>
                      <span className="font-bold text-slate-700">
                        {formData.plan === 'basic' ? '$29.00' : formData.plan === 'pro' ? '$79.00' : '$249.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Tax / Handling Fee:</span>
                      <span className="font-bold text-slate-700">$0.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-xs">
                      <span className="text-slate-900">Total Charged Amount:</span>
                      <span className="text-black">
                        {formData.plan === 'basic' ? '$29.00' : formData.plan === 'pro' ? '$79.00' : '$249.00'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleMockPayment}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-white bg-black hover:bg-[#1f2937] disabled:bg-slate-200 transition-colors cursor-pointer shadow-sm"
                  >
                    {isLoading ? 'Verifying payment...' : 'Verify Mock Payment & Launch'} <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Support Footer */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <span>Support:</span>
          <a href="mailto:help@salesAI.com" className="text-slate-650 hover:underline">
            help@salesAI.com
          </a>
        </div>

      </div>

      {/* RIGHT COLUMN: BRANDING AND VALUE PROP */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-[#FACC15] p-16 relative overflow-hidden select-none">
        <div className="max-w-md w-full text-center space-y-8">

          {/* Phone checkmark image */}
          <div className="relative mx-auto w-72 h-[450px] drop-shadow-xl flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/signup_side.png"
              alt="SalesAI Premium Phone Check"
              className="w-full h-full object-contain rounded-3xl"
            />
          </div>

          {/* Testimonial/Value Prop Quote */}
          <p className="text-xl font-bold font-outfit text-slate-900 leading-snug px-6">
            &ldquo;Supercharge your outreach with conversational AI agents that speak like humans and qualify leads on autopilot.&rdquo;
          </p>

        </div>
      </div>

    </div>
  );
}

