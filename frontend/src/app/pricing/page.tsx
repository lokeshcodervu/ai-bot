'use client';

import { useState } from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { PricingSection } from '../../components/landing/PricingSection';
import { ROICalculatorCard } from '../../components/landing/ROICalculatorCard';
import { ComplianceGridSection } from '../../components/landing/ComplianceGridSection';
import { FAQSection } from '../../components/landing/FAQSection';
import { Footer } from '../../components/landing/Footer';
import { AuthModal } from '../../components/landing/AuthModal';

export default function PricingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit overflow-x-hidden pt-[80px]">
      
      {/* 1. Header / Navigation Bar */}
      <Navbar onOpenAuthModal={handleOpenAuthModal} />

      {/* 2. Predictable Plans For Every Scale (Pricing Cards Grid) */}
      <PricingSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 3. Calculate Your Monthly Telecalling Savings (Interactive ROI Calculator) */}
      <ROICalculatorCard />

      {/* 4. Built to the Highest Standard (Enterprise Security 3-Column Grid) */}
      <ComplianceGridSection />

      {/* 5. Frequently Asked Questions (Dark #1A1A1A Accordion & Documentation Card) */}
      <FAQSection />

      {/* 6. 3D Particle Wave Dark Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

    </div>
  );
}
