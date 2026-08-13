'use client';

import React, { useState } from 'react';

const formatNum = (num: number) => num.toLocaleString('en-US');

export const ROICalculatorCard: React.FC = () => {
  const [monthlyLeads, setMonthlyLeads] = useState(2500);

  // ROI Math ($1.20 human cost per lead vs $0.18 Closr AI cost per lead)
  const humanCostPerLead = 1.20;
  const aiCostPerLead = 0.18;
  const humanTotal = Math.round(monthlyLeads * humanCostPerLead);
  const aiTotal = Math.round(monthlyLeads * aiCostPerLead);
  const monthlySavings = humanTotal - aiTotal;
  const annualSavings = monthlySavings * 12;

  return (
    <section className="w-full bg-[#FAFAFA] text-[#0A0A0A] py-[60px] px-6 sm:px-10 lg:px-[60px] font-outfit border-b border-neutral-200">
      <div className="max-w-[1440px] mx-auto">
        <div className="max-w-[1320px] mx-auto bg-white border border-[#D4D4D4] rounded-[16px] p-6 sm:p-8 lg:p-[40px] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[56px] items-center">

            {/* Left Section */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-4 max-w-[600px]">
                <h3 className="text-2xl sm:text-4xl lg:text-[48px] font-normal leading-tight lg:leading-[60px] tracking-[-0.02em] text-[#0A0A0A]">
                  Calculate Your Monthly Telecalling Savings
                </h3>
                <p className="text-base sm:text-lg lg:text-[20px] font-normal leading-relaxed lg:leading-[30px] text-[#6D8A96]">
                  Drag the slider to adjust your expected monthly lead volume and compare human call center overhead against Closr AI.
                </p>
              </div>

              {/* Slider Input Box */}
              <div className="space-y-4 pt-2 max-w-[600px]">
                <div className="flex justify-between items-center text-sm sm:text-base font-normal">
                  <span className="text-[#0A0A0A] font-medium">Monthly Lead Volume:</span>
                  <span className="text-lg sm:text-xl font-semibold text-[#1A936F]">
                    {formatNum(monthlyLeads)} leads
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="2500"
                    max="100000"
                    step="2500"
                    value={monthlyLeads}
                    onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                    className="w-full h-2.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#1A936F] focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, #1A936F 0%, #1A936F ${((monthlyLeads - 2500) / (100000 - 2500)) * 100}%, #E5E7EB ${((monthlyLeads - 2500) / (100000 - 2500)) * 100}%, #E5E7EB 100%)`
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs sm:text-sm text-[#6D8A96] font-normal pt-1">
                  <button onClick={() => setMonthlyLeads(2500)} className="hover:text-[#1A936F] transition-colors cursor-pointer">
                    2,500 leads
                  </button>
                  <button onClick={() => setMonthlyLeads(50000)} className="hover:text-[#1A936F] transition-colors cursor-pointer">
                    50,000 leads
                  </button>
                  <button onClick={() => setMonthlyLeads(100000)} className="hover:text-[#1A936F] transition-colors cursor-pointer">
                    100,000 leads
                  </button>
                </div>
              </div>
            </div>

            {/* Right Results Container */}
            <div className="lg:col-span-5">
              <div className="bg-[#F8FAFA] border border-[#E5E7EB] rounded-[16px] p-6 lg:p-8 space-y-6">

                {/* Cost Comparison Row */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200">
                  <div>
                    <div className="text-xs sm:text-sm font-normal text-[#6D8A96]">Human BPO Cost:</div>
                    <div className="text-lg sm:text-xl font-medium text-[#0A0A0A] mt-1">
                      ${formatNum(humanTotal)}/mo
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-normal text-[#6D8A96]">Closr AI Cost:</div>
                    <div className="text-lg sm:text-xl font-semibold text-[#1A936F] mt-1">
                      ${formatNum(aiTotal)}/mo
                    </div>
                  </div>
                </div>

                {/* Savings Highlight Box */}
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[12px] p-5 space-y-2">
                  <div className="text-xs sm:text-sm font-medium text-[#065F46]">
                    Estimated Net Savings:
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[#047857]">
                    ${formatNum(monthlySavings)}
                    <span className="text-sm font-normal text-[#065F46] ml-1">/month</span>
                  </div>
                  <div className="text-xs text-[#047857] font-medium pt-1">
                    (${formatNum(annualSavings)} total yearly savings)
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
