'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset || window.scrollY;
      if (currentScroll > 30) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`page-header ${isSticky ? 'is-sticky' : ''}`}>
      {/* 1440px desktop frame container with exact px-6 sm:px-[40px] lg:px-[60px] padding so Logo aligns directly over "M" in "Make every lead..." */}
      <div className="max-w-[1440px] h-[80px] mx-auto px-6 sm:px-[40px] lg:px-[60px] py-[16px] flex items-center justify-between">

        {/* Left Section: Logo & Nav Links Container (gap 124px on large screens) */}
        <div className="flex items-center gap-8 lg:gap-[124px]">
          {/* Logo aligned directly over M */}
          <a href="/" className="shrink-0 flex items-center">
            <span className="font-outfit text-2xl font-bold text-[#0A0A0A] tracking-tight">
              Logo
            </span>
          </a>

          {/* Nav Links: gap 56px, Outfit 400 16px/24px #0A0A0A */}
          <nav className="hidden md:flex items-center gap-[56px] h-[24px]">
            <a
              href="/#product"
              className="font-outfit font-normal text-[16px] leading-[24px] text-[#0A0A0A] hover:text-[#1A936F] transition-colors whitespace-nowrap"
            >
              Product
            </a>
            <a
              href="/#solutions"
              className="font-outfit font-normal text-[16px] leading-[24px] text-[#0A0A0A] hover:text-[#1A936F] transition-colors whitespace-nowrap"
            >
              Solutions
            </a>
            <a
              href="/customers"
              className="font-outfit font-normal text-[16px] leading-[24px] text-[#0A0A0A] hover:text-[#1A936F] transition-colors whitespace-nowrap"
            >
              Customers
            </a>
            <a
              href="/pricing"
              className="font-outfit font-normal text-[16px] leading-[24px] text-[#0A0A0A] hover:text-[#1A936F] transition-colors whitespace-nowrap"
            >
              Pricing
            </a>
          </nav>
        </div>

        {/* Right Section: Buttons Container (gap 16px) */}
        <div className="hidden sm:flex items-center gap-[16px]">
          {/* "Get a demo" button: 116px width, 48px height, rounded 8px, border 1px solid #1A936F */}
          <button
            onClick={() => onOpenAuthModal('signin')}
            className="w-[116px] h-[48px] rounded-[8px] border border-[#1A936F] px-[16px] py-[12px] font-outfit font-medium text-[16px] leading-[24px] text-[#1A936F] hover:bg-[#1A936F]/10 transition-all flex items-center justify-center whitespace-nowrap"
          >
            Get a demo
          </button>

          {/* "Sign up for free" button: 142px width, 48px height, rounded 8px, bg #1A1A1A */}
          <button
            onClick={() => onOpenAuthModal('signup')}
            className="w-[142px] h-[48px] rounded-[8px] bg-[#1A1A1A] hover:bg-black px-[16px] py-[12px] font-outfit font-medium text-[16px] leading-[24px] text-white transition-all flex items-center justify-center whitespace-nowrap shadow-sm"
          >
            Sign up for free
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#0A0A0A] hover:bg-slate-100 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 font-outfit">
          <a
            href="/#product"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#0A0A0A] font-medium py-2 hover:text-[#1A936F]"
          >
            Product
          </a>
          <a
            href="/#solutions"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#0A0A0A] font-medium py-2 hover:text-[#1A936F]"
          >
            Solutions
          </a>
          <a
            href="/customers"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#0A0A0A] font-medium py-2 hover:text-[#1A936F]"
          >
            Customers
          </a>
          <a
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#0A0A0A] font-medium py-2 hover:text-[#1A936F]"
          >
            Pricing
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal('signin');
              }}
              className="w-full h-[44px] rounded-[8px] border border-[#1A936F] font-medium text-[#1A936F]"
            >
              Get a demo
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal('signup');
              }}
              className="w-full h-[44px] rounded-[8px] bg-[#1A1A1A] text-white font-medium"
            >
              Sign up for free
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
