'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Award, ShieldCheck, Lock, Server, Key } from 'lucide-react';

export const ComplianceGridSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.60}
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="security"
      ref={sectionRef}
      className="w-full bg-white text-[#0A0A0A] py-[60px] font-outfit border-b border-neutral-200 overflow-hidden"
    >
      <div className="max-w-[1440px] px-6 sm:px-10 lg:px-[60px] mx-auto min-h-[640px] lg:min-h-[760px] flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-[48px]">

        {/* 1. Left Text Column (Width: 585px, Height: 250px) */}
        <div className="w-full lg:max-w-[540px] space-y-4">
          <h2 className="text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
            Built to the Highest Standard.
          </h2>
          <p className="max-w-[460px] text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
            Enterprise-grade security controls designed for regulated insurance, banking, and healthcare operations.
          </p>
        </div>

        {/* 2. Right Column: Staggered 3-Column Security Cards with Scroll Slide-Up */}
        <div className="w-full lg:w-[780px] grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6 items-center justify-items-center">

          {/* Column 1: Top & Bottom Cards */}
          <div className="space-y-5 lg:space-y-6 flex flex-col justify-between h-full w-full items-center">
            {/* Card 1: SOC2 & ISO 27001 */}
            <div
              className="w-full sm:w-[230px] lg:w-[240px] min-h-[280px] bg-white rounded-[16px] p-5 lg:p-6 border border-neutral-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)] flex flex-col justify-between"
              style={{
                transform: isVisible ? 'translateY(0px)' : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 100ms, opacity 600ms ease 100ms',
              }}
            >
              <div className="w-[42px] h-[42px] rounded-[8px] border border-[#D4D4D4] p-2 flex items-center justify-center text-[#6D8A96]">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg lg:text-[20px] font-normal leading-[30px] text-[#0A0A0A]">
                  SOC2 & ISO 27001 Ready
                </h3>
                <p className="text-sm lg:text-[16px] font-normal leading-[24px] text-[#6D8A96]">
                  Built following SOC2 Type II trust principles and ISO 27001 data security standards.
                </p>
              </div>
            </div>

            {/* Card 2: DND & TRAI Compliance */}
            <div
              className="w-full sm:w-[230px] lg:w-[240px] min-h-[280px] bg-white rounded-[16px] p-5 lg:p-6 border border-neutral-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)] flex flex-col justify-between"
              style={{
                transform: isVisible ? 'translateY(0px)' : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 200ms, opacity 600ms ease 200ms',
              }}
            >
              <div className="w-[42px] h-[42px] rounded-[8px] border border-[#D4D4D4] p-2 flex items-center justify-center text-[#6D8A96]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg lg:text-[20px] font-normal leading-[30px] text-[#0A0A0A]">
                  DND & TRAI Compliance
                </h3>
                <p className="text-sm lg:text-[16px] font-normal leading-[24px] text-[#6D8A96]">
                  Real-time checking against national Do-Not-Call databases prior to dialer queue execution.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Center Offset Card */}
          <div className="flex items-center justify-center h-full w-full">
            {/* Card 3: 256-Bit SSL Encryption */}
            <div
              className="w-full sm:w-[230px] lg:w-[240px] min-h-[280px] bg-white rounded-[16px] p-5 lg:p-6 border border-neutral-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)] flex flex-col justify-between"
              style={{
                transform: isVisible ? 'translateY(0px)' : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 300ms, opacity 600ms ease 300ms',
              }}
            >
              <div className="w-[42px] h-[42px] rounded-[8px] border border-[#D4D4D4] p-2 flex items-center justify-center text-[#6D8A96]">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg lg:text-[20px] font-normal leading-[30px] text-[#0A0A0A]">
                  256-Bit SSL Encryption
                </h3>
                <p className="text-sm lg:text-[16px] font-normal leading-[24px] text-[#6D8A96]">
                  All audio streams and data payloads are encrypted end-to-end using TLS 1.3 & AES-256.
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Top & Bottom Cards */}
          <div className="space-y-5 lg:space-y-6 flex flex-col justify-between h-full w-full items-center">
            {/* Card 4: 99.99% Uptime SLA */}
            <div
              className="w-full sm:w-[230px] lg:w-[240px] min-h-[280px] bg-white rounded-[16px] p-5 lg:p-6 border border-neutral-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)] flex flex-col justify-between"
              style={{
                transform: isVisible ? 'translateY(0px)' : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 400ms, opacity 600ms ease 400ms',
              }}
            >
              <div className="w-[42px] h-[42px] rounded-[8px] border border-[#D4D4D4] p-2 flex items-center justify-center text-[#6D8A96]">
                <Server className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg lg:text-[20px] font-normal leading-[30px] text-[#0A0A0A]">
                  99.99% Telephony Uptime SLA
                </h3>
                <p className="text-sm lg:text-[16px] font-normal leading-[24px] text-[#6D8A96]">
                  Redundant cloud node clusters ensure active telephony calls remain connected with zero downtime.
                </p>
              </div>
            </div>

            {/* Card 5: Role-Based Access Control */}
            <div
              className="w-full sm:w-[230px] lg:w-[240px] min-h-[280px] bg-white rounded-[16px] p-5 lg:p-6 border border-neutral-200/80 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.28),0_10px_20px_-8px_rgba(0,0,0,0.18)] flex flex-col justify-between"
              style={{
                transform: isVisible ? 'translateY(0px)' : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1) 500ms, opacity 600ms ease 500ms',
              }}
            >
              <div className="w-[42px] h-[42px] rounded-[8px] border border-[#D4D4D4] p-2 flex items-center justify-center text-[#6D8A96]">
                <Key className="w-5 h-5" />
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-lg lg:text-[20px] font-normal leading-[30px] text-[#0A0A0A]">
                  Role-Based Access Control
                </h3>
                <p className="text-sm lg:text-[16px] font-normal leading-[24px] text-[#6D8A96]">
                  Granular permissions for Business Owners, Campaign Managers, and Auditor roles.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

