'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './store';

// Light SaaS Landing Page Section Components
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { PartnerLogos } from '../components/landing/PartnerLogos';
import { MetricsBar } from '../components/landing/MetricsBar';
import { LeadLifecycleSection } from '../components/landing/LeadLifecycleSection';
import { CoreFeaturesSection } from '../components/landing/CoreFeaturesSection';
import { VoiceEngineSection } from '../components/landing/VoiceEngineSection';
import { IndiaComplianceSection } from '../components/landing/IndiaComplianceSection';
import { RealImpactSection } from '../components/landing/RealImpactSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { ComplianceGridSection } from '../components/landing/ComplianceGridSection';
import { CallToActionSection } from '../components/landing/CallToActionSection';
import { Footer } from '../components/landing/Footer';
import { AuthModal } from '../components/landing/AuthModal';

export default function LandingPage() {
  const router = useRouter();
  const { token, tenant, initStoreFromStorage } = useStore();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Hydrate store safely on client mount
  useEffect(() => {
    initStoreFromStorage();
  }, [initStoreFromStorage]);

  // Auto redirect to dashboard ONLY if logged in & payment done
  useEffect(() => {
    if (token && tenant && tenant.isPaymentDone === true) {
      router.push('/dashboard');
    }
  }, [token, tenant, router]);

  const handleOpenAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* 1. Header / Navbar */}
      <Navbar onOpenAuthModal={handleOpenAuthModal} />

      {/* 2. Hero Section + Real Application Preview Window */}
      <HeroSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 3. Grayscale Partner Enterprise Logo Wall */}
      <PartnerLogos />

      {/* 4. Technical Benchmarks & Metrics */}
      <MetricsBar />

      {/* 5. How It Works: Timeline Process (Step 1 ➔ 5) */}
      <LeadLifecycleSection />

      {/* 6. Core Enterprise Capabilities */}
      <CoreFeaturesSection />

      {/* 7. Multilingual Speech Engine (Sarvam AI & ElevenLabs) */}
      <VoiceEngineSection />

      {/* 8. Regulated India Telephony & Compliance */}
      <IndiaComplianceSection />

      {/* 9. Measured Business Outcomes & ROI Calculator */}
      <RealImpactSection />

      {/* 10. Human Customer Proof & Testimonials */}
      <TestimonialsSection />

      {/* 11. 3-Tier Predictable SaaS Pricing Table */}
      <PricingSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 12. Accordion Frequently Asked Questions */}
      <FAQSection />

      {/* 13. Security Standards Grid */}
      <ComplianceGridSection />

      {/* 14. High-Conversion Call To Action Banner */}
      <CallToActionSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 15. Clean 4-Column Light Footer */}
      <Footer />

      {/* 16. Integrated Sign In & Tenant Onboarding Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />

    </div>
  );
}
