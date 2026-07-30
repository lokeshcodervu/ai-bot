'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';
import { Bot, ArrowRight, Lock, Mail, ChevronLeft, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, setTenant, initStoreFromStorage } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initStoreFromStorage();
  }, [initStoreFromStorage]);

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
          username: email,
          password: password
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setUser(data.user);
        if (data.tenant) {
          setTenant(data.tenant);
        }
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-white">
      
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <a
          href="/"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-amber-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </a>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <a href="/" className="inline-flex items-center space-x-3 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">TeleBot</span>
              <span className="text-2xl font-black text-amber-500 tracking-tight font-display uppercase">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Voice Telephony Platform</p>
          </div>
        </a>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display uppercase">
          Sign in to your account
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Or{' '}
          <a href="/" className="font-bold text-amber-600 hover:text-amber-700">
            start a 14-day free trial workspace
          </a>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? <span>Signing In...</span> : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Telephony & Tenant Isolation</span>
          </div>

        </div>
      </div>
    </div>
  );
}
