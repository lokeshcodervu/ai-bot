'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ChevronRight, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 shadow-sm'
          : 'bg-white py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6">
          
          {/* Brand Logo - Fixed shrink */}
          <a href="#" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">TeleBot</span>
                <span className="text-2xl font-black text-amber-500 tracking-tight font-display uppercase">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Voice Telephony Platform</p>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 shrink-0">
            <a href="#workflow" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              How It Works
            </a>
            <a href="#features" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              Capabilities
            </a>
            <a href="#multilingual" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              Multilingual Speech
            </a>
            <a href="#compliance" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              Compliance
            </a>
            <a href="#impact" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              ROI & Impact
            </a>
            <a href="#pricing" className="text-sm font-bold text-slate-700 hover:text-amber-500 transition-colors whitespace-nowrap">
              Pricing
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center space-x-4 shrink-0">
            {/* Live Uptime Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sub-400ms Engine Active</span>
            </div>

            {/* Auth Buttons */}
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-bold text-slate-700 hover:text-amber-500 px-3 py-2 transition-colors whitespace-nowrap"
            >
              Sign In
            </button>

            <button
              onClick={() => onOpenAuthModal('signup')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center space-x-1.5 whitespace-nowrap"
            >
              <span>Start 14-Day Free Trial</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-6 border-t border-slate-200 bg-white rounded-2xl p-4 shadow-xl border">
            <div className="flex flex-col space-y-4">
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-amber-500"
              >
                How It Works
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-amber-500"
              >
                Capabilities
              </a>
              <a
                href="#multilingual"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-amber-500"
              >
                Multilingual Speech
              </a>
              <a
                href="#compliance"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-amber-500"
              >
                Compliance
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-amber-500"
              >
                Pricing
              </a>

              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/login');
                  }}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal('signup');
                  }}
                  className="w-full text-center py-2.5 rounded-xl bg-amber-500 text-white font-bold shadow-md shadow-amber-500/20"
                >
                  Start 14-Day Free Trial
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
