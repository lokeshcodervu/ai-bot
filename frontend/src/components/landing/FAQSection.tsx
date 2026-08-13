'use client';

import React, { useState } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is Tele-Bot-AI?',
      a: 'Closr AI is an enterprise-grade voice AI automation platform that dials leads, answers inbound calls, executes complex sales pitches, and syncs transcripts & sentiment directly to your CRM with zero human delay.',
    },
    {
      q: 'How does Closr AI handle regional Indian accents and Hinglish?',
      a: 'Closr AI integrates real-time speech-to-text recognition and native voice synthesis pre-trained on Indian telephony data. This provides human-level accuracy for Hindi, Hinglish code-switching, Tamil, Telugu, Kannada, and Marathi accents.',
    },
    {
      q: 'How does the verified Knowledge Base prevent AI hallucinations?',
      a: 'When a prospect asks a complex question about policy riders or pricing, the system queries your uploaded PDF handbooks under strict RAG grounding. The AI is restricted to stating verified document facts with zero hallucinated claims.',
    },
    {
      q: 'Is Closr AI compliant with TRAI DND regulations in India?',
      a: 'Yes. Every phone number in your campaign list is dynamically scrubbed against the National Do-Not-Disturb (DND) registry prior to dialer execution. Outbound calling is also automatically restricted to permissible hours (09:00 AM – 08:00 PM).',
    },
    {
      q: 'How low is the voice streaming turnaround latency?',
      a: 'The entire pipeline—from audio streaming input, speech recognition, reasoning, to voice synthesis output—operates asynchronously with ultra-low sub-500ms turnaround latency for smooth, natural back-and-forth speech flow.',
    },
    {
      q: 'Can I push call transcripts and audio recordings to my existing CRM?',
      a: 'Yes. The post-call pipeline automatically generates a structured call summary, lead sentiment score, encrypted audio recording link, and transcript JSON, which are immediately pushed via webhooks to Salesforce, HubSpot, LeadSquared, or Zoho.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full bg-[#1A1A1A] text-white py-[60px] font-outfit border-b border-neutral-900">
      <div className="max-w-[1440px] px-6 sm:px-10 lg:px-[60px] mx-auto min-h-[680px] lg:min-h-[800px] flex flex-col lg:flex-row items-start justify-between gap-12 lg:gap-[56px]">

        {/* 1. Left Column: Heading & FAQ Accordion List (Width: 800px) */}
        <div className="w-full lg:max-w-[800px] space-y-8 lg:space-y-[40px]">
          {/* Heading: Frequently Asked Questions (800x72, 60px Outfit, -2% tracking, #FFFFFF) */}
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-white">
            Frequently Asked Questions
          </h2>

          {/* Accordion Questions List */}
          <div className="w-full border-t border-[#262626]">
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="border-b border-[#262626] transition-colors"
                >
                  {/* Question Row: 800x92, padding 30px 8px, font 24px Outfit, color #E5E5E5 */}
                  <button
                    onClick={() => toggle(idx)}
                    className="w-full py-[30px] px-[8px] flex items-center justify-between space-x-4 text-left focus:outline-none cursor-pointer group"
                  >
                    <span className="text-lg sm:text-xl lg:text-[24px] font-normal leading-[32px] text-[#E5E5E5] group-hover:text-white transition-colors">
                      {faq.q}
                    </span>
                    <div className={`p-1.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-[#E5E5E5]'}`}>
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </button>

                  {/* Answer Content */}
                  {isOpen && (
                    <div className="px-[8px] pb-[30px] text-base lg:text-[18px] font-normal leading-[28px] text-[#6D8A96]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Right Documentation Frame (Frame 10 - Width: 464px) */}
        <div className="w-full lg:max-w-[464px] space-y-6 lg:my-auto pt-6 lg:pt-16">
          {/* Frame 10 Text Block: 464x96, 24px Outfit, 32px line-height, #E5E5E5 */}
          <p className="text-lg sm:text-xl lg:text-[24px] font-normal leading-[32px] text-[#E5E5E5]">
            Can’t find the answer you’re looking for? Take a look in our Documentation. Click the button below to find the answers you need.
          </p>

          {/* Documentation Button: 193x52, padding 12px 16px 12px 20px, radius 8px, bg #1A936F */}
          <a
            href="#documentation"
            className="inline-flex items-center justify-center space-x-2 w-[193px] h-[52px] rounded-[8px] bg-[#1A936F] hover:bg-[#157a5c] text-white font-outfit text-base font-normal px-[20px] py-[12px] transition-colors shadow-sm cursor-pointer"
          >
            <span>Documentation</span>
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </div>

      </div>
    </section>
  );
};
