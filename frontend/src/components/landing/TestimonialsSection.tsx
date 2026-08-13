'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquareQuote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const testimonials = [
    {
      logoText: 'StarHealth',
      company: 'Star Health Insurance',
      quote: 'Closr AI allowed us to scale our policy renewal outreach from 4,000 to 45,000 calls per day. The regional voice models sound so human that 94% of prospects completed policy verification smoothly.',
      author: 'Vikram Malhotra',
      role: 'VP of Digital Sales',
      rating: 5,
      avatar: '/customer-1.jpg',
    },
    {
      logoText: 'CareHealth',
      company: 'Care Health Insurance',
      quote: 'The verified document knowledge integration was a game changer. Our sales agents used to make pitch errors on complex riders. Pitch compliance is now strictly 100% and customer trust has skyrocketed.',
      author: 'Ananya Deshmukh',
      role: 'Head of Customer Experience',
      rating: 5,
      avatar: '/customer-2.jpg',
    },
    {
      logoText: 'PolicyBazaar',
      company: 'PolicyBazaar Enterprise',
      quote: 'We replaced our 60-member outbound calling agency with Closr AI in less than 2 weeks. The automated post-call summaries and instant CRM sync save us over $38,000 every single month.',
      author: 'Rajesh Kulkarni',
      role: 'Director of Telephony',
      rating: 5,
      avatar: '/customer-3.jpg',
    },
    {
      logoText: 'Digit',
      company: 'Digit Insurance',
      quote: 'Handling inbound claim status calls with zero wait time boosted our customer satisfaction scores by 4.2x within 60 days. The AI handles end-to-end policy updates effortlessly.',
      author: 'Priya Sharma',
      role: 'Chief Operations Officer',
      rating: 5,
      avatar: '/user_avatar.png',
    },
    {
      logoText: 'HDFC ERGO',
      company: 'HDFC ERGO',
      quote: 'Multilingual Indian regional speech models sound so natural that leads engage in full 3-minute conversations effortlessly. Conversions increased by 3.5x in our primary campaigns.',
      author: 'Rohan Mehta',
      role: 'Head of Sales Automation',
      rating: 5,
      avatar: '/customer-1.jpg',
    },
    {
      logoText: 'ICICI Lombard',
      company: 'ICICI Lombard',
      quote: 'Outbound renewal conversion rates jumped by 85% in the first month alone. Automated lead callbacks within 30 seconds of form fill doubled our daily sales capacity.',
      author: 'Karan Verma',
      role: 'VP of Enterprise Growth',
      rating: 5,
      avatar: '/customer-2.jpg',
    },
  ];

  // Show 3 cards per view on desktop
  const visibleCards = 3;
  const maxIndex = Math.max(0, testimonials.length - visibleCards);

  // Auto Slider Effect
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <section
      id="testimonials"
      className="w-full bg-[#F5F7FA] text-[#0A0A0A] py-10 lg:py-12 px-6 sm:px-10 lg:px-[60px] font-outfit border-b border-neutral-200 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto space-y-6 lg:space-y-8">

        {/* 1. Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[1320px] mx-auto">
          <div>
            <h2 className="max-w-[616px] text-3xl sm:text-5xl lg:text-[60px] font-normal leading-tight lg:leading-[72px] tracking-[-0.02em] text-[#0A0A0A]">
              What our customers say
            </h2>
          </div>
        </div>

        {/* 2. Auto-playing Carousel Slider Container */}
        <div
          className="w-full max-w-[1320px] mx-auto overflow-hidden py-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="flex items-center transition-transform duration-700 ease-out gap-6"
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCards + 0.85)}%)`,
            }}
          >
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] h-[480px] lg:h-[500px] flex-shrink-0 [perspective:1200px] group cursor-pointer"
              >
                {/* 3D Flip Card Inner Container */}
                <div className="relative w-full h-full duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-[0_6px_24px_rgba(0,0,0,0.06)] group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.15)] rounded-[16px] transition-all">

                  {/* FRONT SIDE: User Profile, Name, Role, Rating & Logo */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white rounded-[16px] border border-[#D4D4D4] p-6 lg:p-8 flex flex-col justify-between">
                    {/* Top Logo / Brand Frame */}
                    <div className="w-full h-[100px] lg:h-[110px] rounded-[12px] bg-[#FAFAFA] border border-neutral-100 flex items-center justify-center">
                      <span className="font-outfit text-xl lg:text-2xl font-extrabold text-[#0A0A0A] tracking-wider">
                        {t.logoText}
                      </span>
                    </div>

                    {/* Middle Section: Profile Avatar & Name */}
                    <div className="flex flex-col items-center justify-center my-auto text-center space-y-3">
                      {/* Avatar */}
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#0A0A0A] shadow-md bg-neutral-100 flex items-center justify-center text-[#0A0A0A] font-bold text-xl">
                        <img
                          src={t.avatar}
                          alt={t.author}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Author Name */}
                      <h3 className="font-outfit font-bold text-xl lg:text-2xl text-[#0A0A0A] tracking-tight">
                        {t.author}
                      </h3>

                      {/* Role & Company */}
                      <p className="font-outfit text-xs lg:text-sm text-[#6D8A96] font-medium max-w-[240px]">
                        {t.role} • <span className="text-[#0A0A0A] font-semibold">{t.company}</span>
                      </p>

                      {/* Star Rating */}
                      <div className="flex items-center space-x-1 text-amber-400 pt-1">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Hover Hint */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-center text-xs text-[#0A0A0A] font-medium space-x-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#0A0A0A]" />
                      <span>Hover to read full review ↺</span>
                    </div>
                  </div>

                  {/* BACK SIDE: ONLY REVIEW QUOTE (White Card with Black Text) */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white text-[#0A0A0A] rounded-[16px] p-6 lg:p-8 flex flex-col justify-between items-center text-center shadow-xl border border-[#D4D4D4]">
                    <div className="w-full flex justify-between items-center text-[#0A0A0A]">
                      <MessageSquareQuote className="w-6 h-6 text-[#0A0A0A]" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[#6D8A96]">Review</span>
                    </div>

                    <div className="my-auto space-y-3 px-2">
                      <p className="text-base lg:text-[18px] font-normal leading-[26px] lg:leading-[30px] text-[#0A0A0A]">
                        &quot;{t.quote}&quot;
                      </p>
                    </div>

                    <div className="w-full pt-3 border-t border-neutral-100 flex items-center justify-center">
                      <span className="px-3.5 py-1 rounded-full bg-neutral-100 text-[#0A0A0A] border border-neutral-300 text-xs font-medium">
                        Verified Enterprise Client
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

