'use client';

import React, { useState } from 'react';

interface HeroSectionProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuthModal }) => {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenAuthModal('signup');
  };

  return (
    <section className="relative w-full min-h-[810px] lg:h-[810px] pt-[80px] flex items-center overflow-hidden bg-slate-900">
      {/* 1. Background Video / Fallback Image Overlay */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop"
          className="w-full h-full object-cover"
        >
          <source
            src="/video/hero-bg.mp4"
            type="video/mp4"
          />
          <source
            src="/video/6194045-uhd_3840_2160_25fps (4).mp4"
            type="video/mp4"
          />
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-man-talking-on-a-cell-phone-in-an-office-41555-large.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* 2. Main 1440px Container Frame (Figma specs: width 1440, height 810) */}
      <div className="relative z-10 w-full max-w-[1440px] h-full mx-auto px-6 sm:px-[40px] lg:px-[60px] py-[60px] flex flex-col justify-between gap-12">

        <div className="max-w-[709px] pt-6 lg:pt-12 space-y-4">
          <h1 className="font-outfit font-bold text-white text-4xl sm:text-5xl lg:text-[72px] leading-[1.1] lg:leading-snug tracking-tight [text-shadow:_0_2px_12px_rgba(0,0,0,0.6)]">
            Every Lead Deserves a<br />
            Real Conversation.
          </h1>
          <p className="font-outfit font-normal text-white text-lg sm:text-[22px] leading-[32px] max-w-[688px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)]">
            Closr gives your sales team autonomous agents that call, qualify, follow up, and keep your pipeline moving - without adding another person to your team.          </p>
        </div>

        {/* Bottom Section: Left Stat Cards + Right Registration Card */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8 lg:pt-0">

          {/* Bottom-Left Glass Stat Cards */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Stat Card 1 */}
            <div className="bg-[#482E26]/70 backdrop-blur-md border border-white/15 rounded-xl px-5 py-4 min-w-[170px] shadow-lg">
              <div className="font-outfit font-bold text-white text-2xl tracking-tight">
                &lt;400 ms
              </div>
              <div className="font-outfit font-normal text-white/80 text-sm mt-0.5">
                Streaming Latency
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-[#482E26]/70 backdrop-blur-md border border-white/15 rounded-xl px-5 py-4 min-w-[210px] shadow-lg">
              <div className="font-outfit font-bold text-white text-2xl tracking-tight">
                Zero Hallucination
              </div>
              <div className="font-outfit font-normal text-white/80 text-sm mt-0.5">
                Factual Accuracy
              </div>
            </div>
          </div>

          {/* Bottom-Right Registration & Sign-Up Box (Figma Spec: 520.2px width, 144px height container) */}
          <div className="w-full max-w-[520px] lg:w-[520px] space-y-3">
            {/* Top Row: Email Input & Sign up for free button (Figma Spec: 52px height, 16px gap) */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4 h-auto sm:h-[52px]">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full h-[52px] bg-white/10 backdrop-blur-md border border-white/30 rounded-[8px] px-4 font-outfit text-white placeholder-white/70 text-base outline-none focus:border-white focus:bg-white/20 transition-all"
              />
              <button
                type="submit"
                className="w-full sm:w-auto h-[52px] bg-[#18181B] hover:bg-black text-white font-outfit font-medium text-base px-6 rounded-[8px] transition-all whitespace-nowrap shadow-md active:scale-95"
              >
                Sign up for free
              </button>
            </form>

            {/* Middle Divider: or */}
            <div className="flex items-center my-2 text-white/60 text-xs font-outfit px-2">
              <div className="flex-1 border-t border-white/20" />
              <span className="px-3">or</span>
              <div className="flex-1 border-t border-white/20" />
            </div>

            {/* Google Sign Up Button (Figma Spec: 520.2px width, 52px height, border-radius 8px, padding 12px 16px, background #FFFFFF) */}
            <button
              onClick={() => onOpenAuthModal('signup')}
              type="button"
              className="w-full h-[52px] bg-white hover:bg-slate-100 text-[#0A0A0A] font-outfit font-medium text-base rounded-[8px] px-4 py-3 flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

