'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for signing up! We will contact ${email} shortly.`);
      setEmail('');
    }
  };

  return (
    <footer className="relative w-full bg-black text-white font-outfit overflow-hidden border-t border-neutral-900">

      {/* Background Video (black.mp4) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
      >
        <source src="/video/black.mp4" type="video/mp4" />
      </video>

      {/* Black Shadow & Overlay on top of Video */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      {/* Main Container: 1440px x 1002px */}
      <div className="relative z-10 max-w-[1440px] mx-auto min-h-[1002px] flex flex-col justify-between p-6 sm:p-10 lg:py-[60px] lg:px-[60px]">

        {/* 1. TOP CTA SECTION (Width: 1440px, Height: 350px, Padding: 60px) */}
        <div className="w-full border-b border-white/10 pb-12 lg:pb-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

          {/* Headline Text: 765px x 144px, 60px Outfit, -2% tracking */}
          <h2 className="w-full lg:max-w-[765px] text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-white">
            See Closr AI Handle Your Telecalling & Sales Ops.
          </h2>

          {/* Email Subscription Box: 555px x 52px, Gap 16px */}
          <form onSubmit={handleSubmit} className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 lg:gap-4 sm:max-w-[555px]">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
              className="w-full sm:w-[360px] h-[52px] rounded-[8px] bg-white text-[#0A0A0A] px-4 font-outfit text-base focus:outline-none focus:ring-2 focus:ring-[#1A936F] placeholder:text-neutral-400"
            />
            <button
              type="submit"
              className="w-full sm:w-[160px] h-[52px] rounded-[8px] bg-[#1A936F] hover:bg-[#157a5c] text-white font-outfit font-normal text-base transition-colors flex items-center justify-center cursor-pointer shadow-sm"
            >
              Sign up for free
            </button>
          </form>

        </div>

        {/* 2. FOOTER MAIN CONTENT & NAVIGATION LINKS (Width: 1320px, Height: 652px) */}
        <div className="w-full pt-12 lg:pt-16 pb-8 space-y-16 lg:space-y-[56px]">

          {/* 4 Column Links Grid: 1320px x 184px */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 px-2 sm:px-8">

            {/* Column 1: Product */}
            <div className="space-y-4">
              <h3 className="font-outfit font-medium text-lg text-white leading-[28px]">
                Product
              </h3>
              <ul className="space-y-2 text-base font-normal leading-[24px] text-[#E5E5E5]">
                <li><a href="#features" className="hover:text-white transition-colors">Voice AI Engine</a></li>
                <li><a href="#workflow" className="hover:text-white transition-colors">Automated Dialer</a></li>
                <li><a href="#compliance" className="hover:text-white transition-colors">DND Scrubbing</a></li>
                <li><a href="#impact" className="hover:text-white transition-colors">ROI Calculator</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              </ul>
            </div>

            {/* Column 2: Security & Scale */}
            <div className="space-y-4">
              <h3 className="font-outfit font-medium text-lg text-white leading-[28px]">
                Security & Scale
              </h3>
              <ul className="space-y-2 text-base font-normal leading-[24px] text-[#E5E5E5]">
                <li><span className="hover:text-white transition-colors cursor-pointer">Low-Latency Audio Streaming</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Verified Knowledge Indexing</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">High-Volume Campaign Dialer</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Isolated Enterprise Data</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">AES-256 Audio Encryption</span></li>
              </ul>
            </div>

            {/* Column 3: Legal & Docs */}
            <div className="space-y-4">
              <h3 className="font-outfit font-medium text-lg text-white leading-[28px]">
                Legal & Docs
              </h3>
              <ul className="space-y-2 text-base font-normal leading-[24px] text-[#E5E5E5]">
                <li><a href="#documentation" className="hover:text-white transition-colors">API Overview</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Enterprise Security</a></li>
                <li><a href="#compliance" className="hover:text-white transition-colors">Privacy & Compliance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Column 4: Find us on social */}
            <div className="space-y-4">
              <h3 className="font-outfit font-medium text-lg text-white leading-[28px]">
                Find us on social
              </h3>
              <ul className="space-y-2 text-base font-normal leading-[24px] text-[#E5E5E5]">
                <li><a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">YouTube</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">X</a></li>
                <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a></li>
              </ul>
            </div>

          </div>

          {/* 3. GIANT BRANDING LOGO & ASK AI BADGES (Width: 1320px, Height: 288px) */}
          <div className="flex flex-col lg:flex-row items-end justify-between gap-8 pt-6">

            {/* Giant Closr Text: 738px x 288px, 230.16px Outfit Medium */}
            <div className="font-outfit font-medium text-[90px] sm:text-[160px] lg:text-[230px] leading-none text-white opacity-80 tracking-[-0.02em] select-none">
              Closr
            </div>

            {/* Ask AI Provider Icons & Copyright Row */}
            <div className="space-y-6 text-right pb-4 w-full lg:w-auto flex flex-col items-end">

              {/* Ask AI Badges */}
              <div className="space-y-3">
                <div className="font-outfit text-sm font-medium text-white tracking-wide">
                  Ask AI about Closr
                </div>
                <div className="flex items-center space-x-2.5 justify-end">
                  {/* ChatGPT (OpenAI) */}
                  <div title="ChatGPT" className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.771-4.2057 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7467-7.0731ZM13.2599 22.4284c-.9586 0-1.8847-.265-2.6841-.7649.076-.041.2227-.1233.3274-.1875l4.385-2.5312a.965.965 0 0 0 .4853-.8363v-6.19l1.8601 1.074c.0505.029.083.078.083.1363v5.293c0 2.213-1.7963 4.0066-4.4567 4.0066Zm-8.4907-3.6677a4.4348 4.4348 0 0 1-.6078-2.6961c.076.0445.2173.1287.3274.1929l4.385 2.5312a.9622.9622 0 0 0 .9706 0l5.361-3.0955v2.148c0 .0586-.0314.1118-.083.1404l-4.5843 2.6473c-1.9168 1.1066-4.3648.4412-5.7689-1.2682ZM2.8797 11.2332a4.444 4.444 0 0 1 2.071-1.9287c0 .0883 0 .2527 0 .381v5.0623a.965.965 0 0 0 .4853.8363l5.361 3.0955-1.8601 1.074c-.0505.029-.1079.029-.1584 0l-4.5843-2.6473c-1.918-1.1066-2.6517-3.4891-1.3145-5.8681Zm14.2885-3.0763-5.361 3.0955v-2.148c0-.0586.0314-.1118.083-.1404l4.5843-2.6473c1.9168-1.1066 4.3648-.4412 5.7689 1.2682.9586 1.156.9586 2.7663.4243 4.2255-.076-.0445-.2173-.1287-.3274-.1929l-4.385-2.5312a.965.965 0 0 0-.7871.0706ZM19.2435 8.7616a4.444 4.444 0 0 1-2.071 1.9287c0-.0883 0-.2527 0-.381V5.247c0-.3469-.186-.6672-.4853-.8363l-5.361-3.0955 1.8601-1.074c.0505-.029.1079-.029.1584 0l4.5843 2.6473c1.918 1.1066 2.6517 3.4891 1.3145 5.8681ZM8.8633 1.5716c.9586 0 1.8847.265 2.6841.7649-.076.041-.2227.1233-.3274.1875l-4.385 2.5312a.965.965 0 0 0-.4853.8363v6.19l-1.8601-1.074A.1625.1625 0 0 1 4.4066 10.87V5.577c0-2.213 1.7963-4.0054 4.4567-4.0054Z" />
                    </svg>
                  </div>

                  {/* Claude (Anthropic) */}
                  <div title="Claude AI" className="w-10 h-10 rounded-xl bg-[#1A936F] text-white backdrop-blur-md flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer">
                    <Sparkles className="w-5 h-5" />
                  </div>

                  {/* Perplexity */}
                  <div title="Perplexity AI" className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer text-white font-mono font-bold text-sm">
                    𝝋
                  </div>

                  {/* Grok */}
                  <div title="Grok AI" className="w-10 h-10 rounded-xl bg-red-500/80 text-white backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer font-bold text-sm">
                    ✴
                  </div>

                  {/* Gemini */}
                  <div title="Google Gemini" className="w-10 h-10 rounded-xl bg-blue-500/80 text-white backdrop-blur-md flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer font-bold text-sm">
                    ✦
                  </div>
                </div>
              </div>

              {/* Copyright Notice */}
              <div className="font-outfit text-sm text-[#E5E5E5] font-normal tracking-wide">
                © 2026 Closr AI. All rights reserved.
              </div>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
};
