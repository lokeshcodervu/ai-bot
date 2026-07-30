'use client';

import React from 'react';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote: "TeleBot AI allowed us to scale our policy renewal outreach from 4,000 to 45,000 calls per day. The regional voice models sound so human that 94% of our prospects completed the policy verification call without asking if it was an AI.",
      author: "Vikram Malhotra",
      role: "VP of Digital Sales & Operations",
      company: "Star Health Insurance",
      avatarInitials: "VM",
      badgeColor: "bg-blue-600",
      rating: 5
    },
    {
      quote: "The verified document knowledge integration was a game changer. Our sales agents used to make pitch errors on complex senior citizen riders. With TeleBot AI, pitch compliance is strictly 100% and customer trust has skyrocketed.",
      author: "Ananya Deshmukh",
      role: "Head of Customer Experience",
      company: "Care Health Insurance",
      avatarInitials: "AD",
      badgeColor: "bg-emerald-600",
      rating: 5
    },
    {
      quote: "We replaced our 60-member outbound calling agency with TeleBot AI in less than 2 weeks. The automated post-call summaries and instant CRM sync save us over $38,000 every month.",
      author: "Rajesh Kulkarni",
      role: "Director of Business Telephony",
      company: "PolicyBazaar Enterprise",
      avatarInitials: "RK",
      badgeColor: "bg-indigo-600",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-blue-600 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200">
            Customer Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Trusted by Leaders in Telephony & Insurance.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            See how top Indian health insurers and enterprise sales teams rely on TeleBot AI every single day.
          </p>
        </div>

        {/* 3 Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic mb-8">
                  &quot;{t.quote}&quot;
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center space-x-4">
                <div className={`w-11 h-11 rounded-full ${t.badgeColor} text-white font-bold flex items-center justify-center text-sm shadow-sm`}>
                  {t.avatarInitials}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">{t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
