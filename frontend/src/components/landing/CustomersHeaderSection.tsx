'use client';

import React from 'react';

export const CustomersHeaderSection: React.FC = () => {
  // 7 Logo Cards duplicated for seamless 360-degree marquee loop
  const logos = [
    'Logo',
    'Logo',
    'Logo',
    'Logo',
    'Logo',
    'Logo',
    'Logo',
  ];

  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="w-full bg-[#F5F7FA] text-[#0A0A0A] py-10 lg:py-12 px-6 sm:px-10 lg:px-[60px] font-outfit border-b border-neutral-200 overflow-hidden">
      <div className="max-w-[1440px] mx-auto space-y-6 lg:space-y-8">

        {/* 1. Header Text Block (Width: 712px, Height: 220px, Gap: 16px) */}
        <div className="max-w-[712px] space-y-3">
          {/* Headline Text: 712x144, 60px Outfit, -2% tracking */}
          <h1 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
            Teams that stopped leaving leads uncalled.
          </h1>

          {/* Subtitle Text: 712x60, 20px Outfit, 30px line-height, #6D8A96 */}
          <p className="text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
            Four programs running on Closr AI today - what was broken, what they set up, and what changed. Open any case to read the detail.
          </p>
        </div>

        {/* 2. Auto Slider (Width: 1320px, Height: 130px, Non-clickable, Auto marquee) */}
        <div className="w-full max-w-[1320px] mx-auto overflow-hidden relative pointer-events-none select-none pt-2">
          {/* Gradient Edge Blurs */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F5F7FA] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#F5F7FA] to-transparent z-10" />

          {/* Continuous Infinite Marquee Track */}
          <div className="animate-marquee flex items-center space-x-6 lg:space-x-[56px]">
            {duplicatedLogos.map((logo, idx) => (
              <div
                key={idx}
                className="w-[160px] sm:w-[175px] h-[130px] flex-shrink-0 bg-white rounded-[8px] border border-[#D4D4D4] p-[20px_30px] flex items-center justify-center shadow-sm"
              >
                <span className="font-outfit text-2xl lg:text-3xl font-normal text-[#6D8A96] tracking-wide">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
