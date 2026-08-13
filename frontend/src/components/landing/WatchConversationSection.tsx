'use client';

import React from 'react';

export const WatchConversationSection: React.FC = () => {
  // 5 Left side logo cards flowing along the 5 Figma positions (Pos 5 -> Pos 4 -> Pos 3 -> Pos 2 -> Pos 1)
  const leftLogoCards = [
    { label: 'Logo', delay: '0s' },
    { label: 'Logo', delay: '-4s' },
    { label: 'Logo', delay: '-8s' },
    { label: 'Logo', delay: '-12s' },
    { label: 'Logo', delay: '-16s' },
  ];

  // 5 Right side logo cards flowing along the 5 Figma positions (Pos 5 -> Pos 4 -> Pos 3 -> Pos 2 -> Pos 1)
  const rightLogoCards = [
    { label: 'Logo', delay: '0s' },
    { label: 'Logo', delay: '-4s' },
    { label: 'Logo', delay: '-8s' },
    { label: 'Logo', delay: '-12s' },
    { label: 'Logo', delay: '-16s' },
  ];

  return (
    // <section className="w-full bg-[#0A0A0A] py-0 px-4 sm:px-6 lg:px-8 font-outfit border-b border-neutral-900 overflow-hidden">
    <section className="w-full bg-[#0A0A0A] py-0 font-outfit border-b border-neutral-900 overflow-hidden">
      {/* <div className="max-w-[1440px] mx-auto"> */}
        
        {/* FIGMA CONTAINER BOX: 1440px x 800px */}
        {/* <div className="relative w-full min-h-[720px] lg:h-[800px] bg-[#121212] rounded-[16px] border border-neutral-800 flex items-center justify-center overflow-hidden p-6 sm:p-12 shadow-2xl"> */}
        <div className="relative w-full min-h-[720px] lg:h-[800px] bg-[#121212] flex items-center justify-center overflow-hidden p-6 sm:p-12 shadow-2xl">
          
          {/* Subtle Radial Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)] pointer-events-none" />

          {/* Left Arc Flowing Logo Cards (Desktop) */}
          <div className="hidden lg:block">
            {leftLogoCards.map((card, idx) => (
              <div
                key={`left-${idx}`}
                className="left-orbit-card absolute w-[160px] h-[120px] bg-[#1A1A1A] rounded-[8px] p-[20px_30px] flex items-center justify-center border border-white/10 transition-colors duration-300 hover:border-white/30 hover:z-20 cursor-pointer shadow-lg"
                style={{
                  animationDelay: card.delay,
                  boxShadow: '0 4px 4px rgba(255, 255, 255, 0.05), 0 16px 32px rgba(255, 255, 255, 0.1)',
                }}
              >
                <span className="font-outfit text-[#6D8A96] text-xl font-normal tracking-wide">
                  {card.label}
                </span>
              </div>
            ))}
          </div>

          {/* Right Arc Flowing Logo Cards (Desktop) */}
          <div className="hidden lg:block">
            {rightLogoCards.map((card, idx) => (
              <div
                key={`right-${idx}`}
                className="right-orbit-card absolute w-[160px] h-[120px] bg-[#1A1A1A] rounded-[8px] p-[20px_30px] flex items-center justify-center border border-white/10 transition-colors duration-300 hover:border-white/30 hover:z-20 cursor-pointer shadow-lg"
                style={{
                  animationDelay: card.delay,
                  boxShadow: '0 4px 4px rgba(255, 255, 255, 0.05), 0 16px 32px rgba(255, 255, 255, 0.1)',
                }}
              >
                <span className="font-outfit text-[#6D8A96] text-xl font-normal tracking-wide">
                  {card.label}
                </span>
              </div>
            ))}
          </div>

          {/* Center Text Box (Completely Static - Width: 560px, Height: 250px) */}
          <div className="relative z-10 max-w-[560px] text-center space-y-4 mx-auto">
            {/* Heading text: 560x144, 60px font-size, 72px line-height, -2% tracking, #FFFFFF */}
            <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-white">
              Watch a conversation as it happens.
            </h2>

            {/* Subtext: 460x90, 20px font-size, 30px line-height, #6D8A96 */}
            <p className="max-w-[460px] mx-auto text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
              Streaming transcript, sentiment, intent and the tools the agent fires mid-call - all visible while the call is still running.
            </p>
          </div>

        </div>

      {/* </div> */}
    </section>
  );
};
