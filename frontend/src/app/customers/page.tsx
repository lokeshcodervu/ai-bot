'use client';

import { useState } from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { CustomersHeaderSection } from '../../components/landing/CustomersHeaderSection';
import { CustomerTrustSection } from '../../components/landing/CustomerTrustSection';
import { TestimonialsSection } from '../../components/landing/TestimonialsSection';
import { ComplianceGridSection } from '../../components/landing/ComplianceGridSection';
import { FAQSection } from '../../components/landing/FAQSection';
import { Footer } from '../../components/landing/Footer';
import { AuthModal } from '../../components/landing/AuthModal';

export default function CustomersPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-outfit overflow-x-hidden pt-[80px]">
      
      {/* 1. Header Navigation Bar */}
      <Navbar onOpenAuthModal={handleOpenAuthModal} />

      {/* 2. Customers Header Section: "Teams that stopped leaving leads uncalled." */}
      <CustomersHeaderSection />

      {/* 3. Our Trust Case Studies Showcase */}
      <CustomerTrustSection />

      {/* 4. Customer Case Studies & Testimonials Carousel */}
      <TestimonialsSection />

      {/* 5. Enterprise Security & Compliance Grid: "Built to the Highest Standard." */}
      <ComplianceGridSection />

      {/* 6. Dark Accordion FAQ Section */}
      <FAQSection />

      {/* 7. 3D Particle Wave Dark Footer */}
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
