'use client';

import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface PricingSectionProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuthModal }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <section id="pricing" className="w-full bg-white text-[#0A0A0A] py-[60px] px-6 sm:px-10 lg:px-[60px] font-outfit border-b border-neutral-200">
      <div className="max-w-[1440px] mx-auto space-y-10 lg:space-y-[48px]">
        
        {/* 1. Header Block */}
        <div className="max-w-[1320px] mx-auto">
          {/* Heading: Predictable plans for every scale. (60px Outfit, -2% tracking) */}
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
            Predictable plans for every scale.
          </h2>
        </div>

        {/* 2. 3 Pricing Cards Grid */}
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* CARD 1: Starter Plan */}
          <div className="w-full bg-white rounded-[16px] border border-[#D4D4D4] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              {/* Title */}
              <h3 className="font-outfit text-[20px] font-normal text-[#0A0A0A] mb-4">
                Starter Plan
              </h3>

              {/* Price */}
              <div className="flex items-baseline space-x-1.5 mb-6">
                <span className="font-outfit text-4xl sm:text-[54px] lg:text-[60px] font-normal tracking-tight text-[#0A0A0A]">
                  $49
                </span>
                <span className="font-outfit text-sm lg:text-[16px] font-normal text-[#6D8A96]">
                  / month
                </span>
              </div>

              {/* Included Features */}
              <div className="space-y-3 mb-8">
                <div className="font-outfit text-sm font-semibold text-[#0A0A0A] mb-3">
                  Included Features:
                </div>
                <ul className="space-y-2.5">
                  {[
                    '1,000 outbound call minutes / mo',
                    '1 Active Voice AI Agent Persona',
                    'Natural Human Voice Models',
                    'Instant Carrier Telephony Connection',
                    'Basic CSV Lead Upload',
                    'Email Support & Call Transcript Logs',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm lg:text-[15px] font-normal text-[#6D8A96]">
                      <span className="text-[#6D8A96] select-none">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="w-full h-[52px] rounded-[8px] border border-[#0A0A0A] bg-white text-[#0A0A0A] font-outfit text-base font-normal hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-6"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

          {/* CARD 2: Pro Enterprise (Highlighted / Bordered) */}
          <div className="w-full bg-white rounded-[16px] border-[1.5px] border-[#0A0A0A] p-8 flex flex-col justify-between shadow-lg relative">
            <div>
              {/* Header Row with Billing Switch */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit text-[20px] font-normal text-[#0A0A0A]">
                  Pro Enterprise
                </h3>

                {/* Monthly / Annual Pill Toggle */}
                <div className="bg-neutral-100 p-1 rounded-full border border-neutral-200 flex items-center space-x-1">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-full text-xs font-outfit font-normal transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-[#0A0A0A] shadow-sm'
                        : 'text-[#6D8A96] hover:text-[#0A0A0A]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-full text-xs font-outfit font-normal transition-all cursor-pointer ${
                      billingCycle === 'annual'
                        ? 'bg-[#0A0A0A] text-white shadow-sm'
                        : 'text-[#6D8A96] hover:text-[#0A0A0A]'
                    }`}
                  >
                    Annual
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-1.5 mb-6">
                <span className="font-outfit text-4xl sm:text-[54px] lg:text-[60px] font-normal tracking-tight text-[#0A0A0A]">
                  {billingCycle === 'annual' ? '$159' : '$199'}
                </span>
                <span className="font-outfit text-sm lg:text-[16px] font-normal text-[#6D8A96]">
                  / month
                </span>
              </div>

              {/* Included Features */}
              <div className="space-y-3 mb-8">
                <div className="font-outfit text-sm font-semibold text-[#0A0A0A] mb-3">
                  Included Features:
                </div>
                <ul className="space-y-2.5">
                  {[
                    '5,000 outbound call minutes / mo',
                    'Unlimited AI Agent Personas',
                    'Document Knowledge Base (Upload PDFs)',
                    'Regional Multilingual Voices (Hindi, Hinglish, South Indian)',
                    'Automated Outbound Campaign Dialer',
                    'TRAI DND Registry Filter',
                    'Instant CRM Webhook Sync',
                    'Priority Technical Support',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm lg:text-[15px] font-normal text-[#6D8A96]">
                      <span className="text-[#6D8A96] select-none">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button (Dark Solid) */}
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="w-full h-[52px] rounded-[8px] bg-[#0A0A0A] text-white font-outfit text-base font-normal hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-6 shadow-sm"
            >
              <span>Launch Pro Workspace</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

          {/* CARD 3: Scale Custom */}
          <div className="w-full bg-white rounded-[16px] border border-[#D4D4D4] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              {/* Title */}
              <h3 className="font-outfit text-[20px] font-normal text-[#0A0A0A] mb-4">
                Scale Custom
              </h3>

              {/* Price */}
              <div className="flex items-baseline space-x-1.5 mb-6">
                <span className="font-outfit text-4xl sm:text-[54px] lg:text-[60px] font-normal tracking-tight text-[#0A0A0A]">
                  Custom
                </span>
                <span className="font-outfit text-sm lg:text-[16px] font-normal text-[#6D8A96]">
                  / month
                </span>
              </div>

              {/* Included Features */}
              <div className="space-y-3 mb-8">
                <div className="font-outfit text-sm font-semibold text-[#0A0A0A] mb-3">
                  Included Features:
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Unlimited Call Minutes & Concurrent Streams',
                    'Custom Enterprise Voice Cloning',
                    'High-Volume Enterprise Throughput',
                    'Dedicated Enterprise Data Partitioning',
                    'Custom Private Cloud / On-Premise Deployment',
                    'Dedicated Solutions Architect & 99.99% SLA',
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm lg:text-[15px] font-normal text-[#6D8A96]">
                      <span className="text-[#6D8A96] select-none">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="w-full h-[52px] rounded-[8px] border border-[#0A0A0A] bg-white text-[#0A0A0A] font-outfit text-base font-normal hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-6"
            >
              <span>Contact Enterprise Team</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
