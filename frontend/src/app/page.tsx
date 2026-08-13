'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from './store';

// Light SaaS Landing Page Section Components
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustedProofSection } from '../components/landing/TrustedProofSection';
import { WatchConversationSection } from '../components/landing/WatchConversationSection';
import { LiveConversationSection } from '../components/landing/LiveConversationSection';
import { PartnerLogos } from '../components/landing/PartnerLogos';
import { MetricsBar } from '../components/landing/MetricsBar';
import { LeadLifecycleSection } from '../components/landing/LeadLifecycleSection';
import { CoreFeaturesSection } from '../components/landing/CoreFeaturesSection';
import { VoiceEngineSection } from '../components/landing/VoiceEngineSection';
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-clip">

      {/* 1. Header / Navigation Bar */}
      <Navbar onOpenAuthModal={handleOpenAuthModal} />

      {/* 2. Hero Section: "Every Lead Deserves a Conversation." */}
      <HeroSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 3. Customer Testimonial & Trusted Proof Bar (Metrics: 70%, 4x, 64%) */}
      <TrustedProofSection />

      {/* 4. Real-Time Streaming Live Call Monitor Console */}
      <LiveConversationSection />

      {/* 5. How It Works Timeline Process: "From Zero to Calling in Minutes" */}
      <LeadLifecycleSection />

      {/* 6. Multilingual Speech Engine: "Meet your prospects in the language they prefer." */}
      <VoiceEngineSection />

      {/* 7. Measured Business Outcomes & ROI Calculator: "More conversations. Less repetitive work." */}
      <RealImpactSection />

      {/* 8. Native Tools Connectivity Showcase: 10 Side-Arc Revolving Logo Cards Dark Box Section */}
      <WatchConversationSection />

      {/* 9. Enterprise Security & Compliance Grid: "Built to the Highest Standard." */}
      <ComplianceGridSection />

      {/* 10. Customer Testimonials Slider: "What our customers say" */}
      <TestimonialsSection />

      {/* 11. SaaS Pricing Table: "Predictable plans for every scale." */}
      <PricingSection onOpenAuthModal={handleOpenAuthModal} />

      {/* 12. Dark Accordion FAQ: "Frequently Asked Questions" + Documentation Frame 10 */}
      <FAQSection />

      {/* 13. 3D Particle Wave Dark Footer & CTA Banner: "See Closr AI Handle Your Telecalling & Sales Ops." */}
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
