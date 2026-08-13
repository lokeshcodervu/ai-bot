'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Play, X } from 'lucide-react';

export const CustomerTrustSection: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<{ name: string; videoUrl: string } | null>(null);

  const caseStudies = [
    {
      personName: 'Richerd',
      personRole: 'Director, Operations · Star Health Insurance',
      category: 'INSURANCE',
      statHighlight: '$60M',
      statText: 'added in five months.',
      story: 'The honest change is that no lead sits untouched anymore. That was never a motivation problem - it was arithmetic.',
      image: '/customer-1.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      reverse: false,
    },
    {
      personName: 'Vikram',
      personRole: 'VP of Digital Sales · Care Health Insurance',
      category: 'HEALTHCARE TELEPHONY',
      statHighlight: '85%',
      statText: 'cost savings in 30 days.',
      story: 'Eliminated script errors on complex senior citizen policy riders. Achieved 100% pitch compliance with automated document knowledge grounding.',
      image: '/customer-2.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      reverse: true,
    },
    {
      personName: 'Ananya',
      personRole: 'Head of CX · PolicyBazaar Enterprise',
      category: 'ENTERPRISE SALES',
      statHighlight: '3.5x',
      statText: 'conversion boost achieved.',
      story: 'Sub-10 second instant outbound callbacks on new lead form fills doubled daily sales capacity, saving over $38,000 every single month with instant CRM sync.',
      image: '/customer-3.jpg',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      reverse: false,
    },
  ];

  return (
    <section className="w-full bg-white text-[#0A0A0A] py-[60px] px-6 sm:px-10 lg:px-[60px] font-outfit border-b border-neutral-200">
      <div className="max-w-[1440px] mx-auto space-y-12 lg:space-y-[40px]">
        
        {/* 1. Headline: Our Trust (1320x72, 60px Outfit, -2% tracking, #0A0A0A) */}
        <div className="max-w-[1320px] mx-auto">
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
            Our Trust
          </h2>
        </div>

        {/* 2. Case Studies List (3 Rows, 1320px x 1740px total) */}
        <div className="max-w-[1320px] mx-auto space-y-16 lg:space-y-[40px] py-4">
          {caseStudies.map((study, idx) => (
            <div
              key={idx}
              className={`w-full min-h-[500px] flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-[40px] py-6 ${
                study.reverse ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image Box with Overlay Badge: 700px x 500px, radius 16px */}
              <div
                onClick={() => setActiveVideo({ name: study.personName, videoUrl: study.videoUrl })}
                className="relative w-full lg:w-[700px] h-[360px] sm:h-[450px] lg:h-[500px] rounded-[16px] overflow-hidden bg-[#48b0c8] border border-neutral-200 shadow-md flex-shrink-0 group cursor-pointer"
              >
                {/* Photo with 100% complete top framing (no head truncation!) */}
                <img
                  src={study.image}
                  alt={study.personName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectPosition: 'center 25%' }}
                />

                {/* Dark Gradient Overlay for bottom text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Bottom Overlay Info Container matching Figma spec */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 z-10">
                  
                  {/* Left Name & Subtitle Box (344px x 60px specs) */}
                  <div className="space-y-1 max-w-[344px]">
                    <div className="font-outfit font-semibold text-3xl sm:text-4xl lg:text-[48px] leading-tight lg:leading-[60px] tracking-[-0.02em] text-white drop-shadow-md">
                      {study.personName}
                    </div>
                    <div className="font-outfit text-xs sm:text-sm lg:text-[16px] font-normal text-white/90 drop-shadow">
                      {study.personRole}
                    </div>
                  </div>

                  {/* Right Watch Video Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVideo({ name: study.personName, videoUrl: study.videoUrl });
                    }}
                    className="flex-shrink-0 bg-white text-[#0A0A0A] hover:bg-neutral-100 font-outfit font-medium text-sm lg:text-[15px] px-4 py-2.5 rounded-[8px] transition-colors shadow-md flex items-center space-x-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-[#0A0A0A] text-[#0A0A0A]" />
                    <span>Watch video</span>
                  </button>

                </div>
              </div>

              {/* Side Content Box: 580px x 353px (Matching Figma input_file_0.png) */}
              <div className="w-full lg:w-[580px] space-y-6 flex flex-col justify-center">
                
                {/* Category Badge */}
                <div className="font-outfit text-xs font-semibold uppercase tracking-widest text-[#6D8A96]">
                  {study.category}
                </div>

                {/* Stat Text: $60M added in five months. (72px Outfit, -2% tracking) */}
                <h3 className="font-outfit text-4xl sm:text-6xl lg:text-[72px] font-normal leading-tight lg:leading-[84px] tracking-[-0.02em] text-[#0A0A0A]">
                  <span className="text-[#1A936F] font-semibold">{study.statHighlight}</span> {study.statText}
                </h3>

                {/* Summary Story Text */}
                <p className="font-outfit text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
                  {study.story}
                </p>

                {/* Read Their Story Link */}
                <a
                  href="#case-study"
                  className="inline-flex items-center space-x-1.5 text-[#0A0A0A] font-outfit font-normal text-lg lg:text-[20px] border-b border-[#0A0A0A] pb-0.5 w-fit hover:text-[#1A936F] hover:border-[#1A936F] transition-colors cursor-pointer group"
                >
                  <span>Read their story</span>
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* 3. Interactive Video Player Modal */}
      {activeVideo && (
        <div
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl space-y-4 p-4"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="font-outfit font-medium text-lg text-white">
                Case Study Video — <span className="text-[#1A936F]">{activeVideo.name}</span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
