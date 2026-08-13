'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

import img10001 from '../../img/10001.jpg';
import img10002 from '../../img/10002.png';
import img10003 from '../../img/10003.png';
import img229981 from '../../img/229981.jpeg';

// Custom hook to trigger 60 FPS fast count-up animation when scrolled into view
function useAnimatedCounter(target: number, duration: number = 1600) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Fast easeOutCubic curve for smooth decelerating counter
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(easeOutProgress * target);

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, target, duration]);

  return { count, elementRef };
}

export const TrustedProofSection: React.FC = () => {
  const stat1 = useAnimatedCounter(70, 1500);
  const stat2 = useAnimatedCounter(4, 1200);
  const stat3 = useAnimatedCounter(64, 1500);

  // Logo list using actual image files (10001.jpg, 10002.png, 10003.png, 229981.jpeg)
  const logoList = [
    { name: 'Ring', img: img10001 },
    { name: 'Vapi', img: img10002 },
    { name: 'Superhuman', img: img10003 },
    { name: 'OpenAI', img: img229981 },
    { name: 'Ring', img: img10001 },
    { name: 'Vapi', img: img10002 },
  ];

  return (
    <section className="w-full bg-[#F5F7FA] py-[60px] px-6 sm:px-[40px] lg:px-[60px]">
      <div className="max-w-[1320px] mx-auto flex flex-col gap-[56px]">

        {/* Top Block (1320px x 316px Hug) */}
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-[56px]">

          {/* Left Quote Block (712px x 160px) */}
          <div className="w-full lg:max-w-[712px] flex items-center">
            <p className="font-outfit font-normal text-[20px] sm:text-[24px] leading-[32px] text-[#0A0A0A]">
              Closr is an AI-powered telecalling platform built to turn leads into real conversations. It lets businesses deploy AI agents that handle outreach, qualify prospects, manage follow-ups, and keep the sales pipeline moving—helping teams reach more leads, reduce manual calling, and focus their time on high-value opportunities.
            </p>
          </div>

          {/* Right Trusted By Block (541px x 316px) */}
          <div className="w-full lg:w-[541px] flex flex-col gap-[16px]">
            <h3 className="font-outfit font-normal text-[20px] leading-[28px] text-[#0A0A0A]">
              Trusted By
            </h3>

            {/* 6 Logo Cards Grid (3 cols x 2 rows) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[16px]">
              {logoList.map((logo, idx) => (
                <div
                  key={idx}
                  className="w-full sm:w-[175px] h-[130px] bg-white border border-[#E4E4E7] rounded-[8px] p-4 flex items-center justify-center shadow-sm hover:border-slate-400 transition-all overflow-hidden"
                >
                  <div className="w-full h-full flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
                    <Image
                      src={logo.img}
                      alt={logo.name}
                      className="max-h-[60px] max-w-[120px] w-auto h-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Block (3 Stat Cards Row with Scroll-Triggered Animated Counters) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">

          {/* Stat Card 1: 70% */}
          <div className="w-full bg-white border border-[#E4E4E7] rounded-[8px] p-[30px] flex flex-col justify-between gap-12 shadow-sm">
            <p className="font-outfit font-normal text-[15px] leading-[22px] text-[#71717A]">
              70% Lower manual calling effort
            </p>
            <div className="flex items-end justify-between">
              <span ref={stat1.elementRef} className="font-outfit font-bold text-[48px] leading-[1] text-[#1A936F]">
                {stat1.count}%
              </span>
              <div className="w-10 h-10 relative opacity-70">
                <Image src={img10001} alt="Ring Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Stat Card 2: 4x */}
          <div className="w-full bg-white border border-[#E4E4E7] rounded-[8px] p-[30px] flex flex-col justify-between gap-12 shadow-sm">
            <p className="font-outfit font-normal text-[15px] leading-[22px] text-[#71717A]">
              4X More conversations per sales rep
            </p>
            <div className="flex items-end justify-between">
              <span ref={stat2.elementRef} className="font-outfit font-bold text-[48px] leading-[1] text-[#1A936F]">
                {stat2.count}x
              </span>
              <div className="w-10 h-10 relative opacity-70">
                <Image src={img10002} alt="Vapi Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Stat Card 3: 64% */}
          <div className="w-full bg-white border border-[#E4E4E7] rounded-[8px] p-[30px] flex flex-col justify-between gap-12 shadow-sm">
            <p className="font-outfit font-normal text-[15px] leading-[22px] text-[#71717A]">
              64% Average connection rate
            </p>
            <div className="flex items-end justify-between">
              <span ref={stat3.elementRef} className="font-outfit font-bold text-[48px] leading-[1] text-[#1A936F]">
                {stat3.count}%
              </span>
              <div className="w-10 h-10 relative opacity-70">
                <Image src={img10003} alt="Superhuman Logo" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
