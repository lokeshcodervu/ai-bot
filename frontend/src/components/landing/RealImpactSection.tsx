'use client';

import React, { useState } from 'react';
import { Calculator, DollarSign } from 'lucide-react';

const formatNum = (num: number) => num.toLocaleString('en-US');

export const RealImpactSection: React.FC = () => {
  const [monthlyLeads, setMonthlyLeads] = useState(25000);

  // ROI Math
  const humanCostPerLead = 1.20;
  const aiCostPerLead = 0.18;
  const humanTotal = Math.round(monthlyLeads * humanCostPerLead);
  const aiTotal = Math.round(monthlyLeads * aiCostPerLead);
  const monthlySavings = humanTotal - aiTotal;
  const annualSavings = monthlySavings * 12;

  return (
    <section id="impact" className="py-24 bg-slate-50 border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header matching image style */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-emerald-800 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            Measured Business Outcomes
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            THE NUMBERS FROM<br />
            <span className="text-amber-500 font-display uppercase block mt-1">Live Deployments.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            See how enterprise insurance and sales teams achieve 85% cost savings while boosting daily lead coverage tenfold.
          </p>
        </div>

        {/* 4 Impact Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm hover:shadow transition-shadow">
            <div className="text-4xl sm:text-5xl font-black text-amber-500 font-display mb-1">85%</div>
            <div className="text-sm font-bold text-slate-900">Cost Reduction</div>
            <div className="text-xs text-slate-500 mt-1">vs Human BPO Telecalling</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm hover:shadow transition-shadow">
            <div className="text-4xl sm:text-5xl font-black text-slate-900 font-display mb-1">10x</div>
            <div className="text-sm font-bold text-slate-900">Call Capacity</div>
            <div className="text-xs text-slate-500 mt-1">Instant Scale for Mass Campaigns</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm hover:shadow transition-shadow">
            <div className="text-4xl sm:text-5xl font-black text-emerald-600 font-display mb-1">98%</div>
            <div className="text-sm font-bold text-slate-900">Pitch Accuracy</div>
            <div className="text-xs text-slate-500 mt-1">Verified Document Knowledge</div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm hover:shadow transition-shadow">
            <div className="text-4xl sm:text-5xl font-black text-amber-600 font-display mb-1">3.5x</div>
            <div className="text-sm font-bold text-slate-900">Lead Conversion</div>
            <div className="text-xs text-slate-500 mt-1">Sub-10s Response Time</div>
          </div>
        </div>

        {/* Interactive Clean ROI Calculator */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-10 shadow-xl shadow-slate-200/50">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Slider Input */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center space-x-2 text-amber-600 text-xs font-mono font-bold uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>Interactive Cost & ROI Calculator</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Calculate Your Monthly Telecalling Savings
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed">
                Drag the slider to adjust your expected monthly lead volume and compare human call center overhead against TeleBot AI.
              </p>

              {/* Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-700">Monthly Lead Volume:</span>
                  <span className="text-xl font-mono font-extrabold text-amber-600">{formatNum(monthlyLeads)} leads</span>
                </div>

                <input
                  type="range"
                  min="2500"
                  max="100000"
                  step="2500"
                  value={monthlyLeads}
                  onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-200"
                />

                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>2,500 leads</span>
                  <span>50,000 leads</span>
                  <span>100,000 leads</span>
                </div>
              </div>
            </div>

            {/* Right Comparison Box */}
            <div className="lg:col-span-6">
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-6">
                
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Human BPO Cost:</div>
                    <div className="text-xl font-mono font-bold text-slate-700 mt-1">${formatNum(humanTotal)} /mo</div>
                  </div>

                  <div>
                    <div className="text-xs text-amber-600 font-bold">TeleBot AI Cost:</div>
                    <div className="text-xl font-mono font-bold text-amber-600 mt-1">${formatNum(aiTotal)} /mo</div>
                  </div>
                </div>

                {/* Net Savings Highlight */}
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">ESTIMATED NET SAVINGS</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-0.5">
                      ${formatNum(monthlySavings)} <span className="text-sm font-normal text-emerald-600">/ month</span>
                    </div>
                    <div className="text-xs text-emerald-700 mt-1">
                      (${formatNum(annualSavings)} total yearly savings)
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                    <DollarSign className="w-6 h-6" />
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
