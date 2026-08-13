'use client';

import React, { useState, useEffect, useRef } from 'react';

const formatNum = (num: number) => num.toLocaleString('en-US');

// Custom hook to trigger 60 FPS fast count-up animation when scrolled into view
function useAnimatedCounter(target: number, duration: number = 1600, isDecimal: boolean = false) {
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
      const currentVal = easeOutProgress * target;

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

  const formattedValue = isDecimal ? count.toFixed(1) : Math.floor(count).toString();

  return { countFormatted: formattedValue, elementRef };
}

export const RealImpactSection: React.FC = () => {
  const [monthlyLeads, setMonthlyLeads] = useState(2500);

  // ROI Math ($1.20 human cost per lead vs $0.18 Closr AI cost per lead)
  const humanCostPerLead = 1.20;
  const aiCostPerLead = 0.18;
  const humanTotal = Math.round(monthlyLeads * humanCostPerLead);
  const aiTotal = Math.round(monthlyLeads * aiCostPerLead);
  const monthlySavings = humanTotal - aiTotal;
  const annualSavings = monthlySavings * 12;

  // Animated counters for 4 stat metrics
  const stat1 = useAnimatedCounter(85, 1500, false);
  const stat2 = useAnimatedCounter(10, 1400, false);
  const stat3 = useAnimatedCounter(3.5, 1600, true);
  const stat4 = useAnimatedCounter(98, 1500, false);

  const statCards = [
    {
      ref: stat1.elementRef,
      stat: `${stat1.countFormatted}%`,
      title: 'Cost Reduction',
      subtitle: 'vs Human BPO Telecalling',
    },
    {
      ref: stat2.elementRef,
      stat: `${stat2.countFormatted}x`,
      title: 'Call Capacity',
      subtitle: 'Instant Scale for Mass Campaigns',
    },
    {
      ref: stat3.elementRef,
      stat: `${stat3.countFormatted}x`,
      title: 'Lead Conversion',
      subtitle: 'Sub-10s Response Time',
    },
    {
      ref: stat4.elementRef,
      stat: `${stat4.countFormatted}%`,
      title: 'Pitch Accuracy',
      subtitle: 'Verified Document Knowledge',
    },
  ];

  return (
    <section id="impact" className="w-full bg-[#FAFAFA] text-[#0A0A0A] py-[60px] font-outfit border-b border-neutral-200">
      <div className="max-w-[1440px] mx-auto space-y-[56px] px-6 sm:px-10 lg:px-[60px]">

        {/* 1. Header Text Section */}
        <div className="max-w-[978px] space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
            Numbers from live deployments.
          </h2>
          <p className="max-w-[822px] text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
            See how enterprise insurance and sales teams achieve 85% cost savings while boosting daily lead coverage tenfold.
          </p>
        </div>

        {/* 2. Stat Box Section (2x2 Grid with Scroll-Triggered Animated Counters) */}
        <div className="max-w-[1320px] grid grid-cols-1 md:grid-cols-2 gap-6">
          {statCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#D4D4D4] rounded-[16px] p-6 lg:p-[24px] flex items-center gap-6 sm:gap-[40px] shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Left Stat Number */}
              <div className="w-[126px] sm:w-[140px] flex-shrink-0 text-center font-semibold text-5xl sm:text-6xl lg:text-[72px] leading-tight lg:leading-[84px] tracking-[-0.02em] text-[#1A936F]">
                <span ref={card.ref}>{card.stat}</span>
              </div>

              {/* Right Text Block */}
              <div className="flex-1 space-y-1">
                <h3 className="text-xl sm:text-2xl lg:text-[30px] font-normal leading-snug lg:leading-[38px] text-[#0A0A0A]">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base lg:text-[18px] font-normal leading-relaxed text-[#6D8A96]">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Interactive ROI Savings Calculator Card */}
        <div className="max-w-[1320px] bg-white border border-[#D4D4D4] rounded-[24px] p-6 sm:p-10 lg:p-[48px] shadow-lg space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-neutral-200">
            <div>
              <h3 className="text-2xl sm:text-3xl font-semibold text-[#0A0A0A]">
                Calculate Your Closr AI ROI Savings
              </h3>
              <p className="text-[#6D8A96] text-base sm:text-lg mt-1">
                Adjust your monthly lead volume to estimate instant operational cost reduction.
              </p>
            </div>
            <div className="bg-[#1A936F]/10 border border-[#1A936F]/20 px-5 py-3 rounded-xl flex items-center gap-3 shrink-0">
              <span className="text-xs uppercase font-bold text-[#1A936F] tracking-wider">Estimated Annual Savings</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#1A936F] font-mono">
                ${formatNum(annualSavings)}
              </span>
            </div>
          </div>

          {/* Slider & Math Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Slider Control */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-700">Monthly Lead Volume</span>
                <span className="text-xl font-bold font-mono text-[#0A0A0A] bg-slate-100 px-3 py-1 rounded-lg">
                  {formatNum(monthlyLeads)} leads/mo
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1A936F]"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>500 leads</span>
                <span>25,000 leads</span>
                <span>50,000 leads</span>
              </div>
            </div>

            {/* Right Cost Comparison Breakdown */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Human BPO Cost</div>
                <div className="text-2xl sm:text-3xl font-bold text-rose-700 font-mono">${formatNum(humanTotal)}</div>
                <div className="text-xs text-rose-500/90 font-medium">@ ${humanCostPerLead.toFixed(2)} / lead</div>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 space-y-1">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Closr AI Cost</div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono">${formatNum(aiTotal)}</div>
                <div className="text-xs text-emerald-600/90 font-medium">@ ${aiCostPerLead.toFixed(2)} / lead</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
