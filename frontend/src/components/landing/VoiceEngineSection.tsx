'use client';

import React, { useState, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceSample {
  id: number;
  name: string;
  langInfo: string;
  tone: string;
  sampleText: string;
  introText: string;
  langCode: string;
}

export const VoiceEngineSection: React.FC = () => {
  const [activeVoiceIndex, setActiveVoiceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const voiceList: VoiceSample[] = [
    {
      id: 0,
      name: 'Neha',
      langInfo: 'Hindi–English · Female · India',
      tone: 'Warm, professional',
      sampleText: 'Hello Mr. Sharma, I am Neha from Star Health Insurance. I noticed your policy is due for renewal.',
      introText: 'Tap play to hear how Neha opens the call, or you can also try interacting with it.',
      langCode: 'en-IN'
    },
    {
      id: 1,
      name: 'Priya',
      langInfo: 'Hindi (हिंदी) · Female · India',
      tone: 'Friendly, empathetic',
      sampleText: 'नमस्ते राहुल जी, आपकी हेल्थ इंश्योरेंस पॉलिसी का रिन्यूअल बोनस एक्टिव हो गया है।',
      introText: 'Tap play to hear how Priya counsels policy holders in natural Hindi.',
      langCode: 'hi-IN'
    },
    {
      id: 2,
      name: 'Rohan',
      langInfo: 'Hinglish · Male · India',
      tone: 'Confident, conversational',
      sampleText: 'Hi Mr. Sharma! Aapki policy expiry 15th August ko hai. Shall I process the 10% discount now?',
      introText: 'Tap play to hear Rohan speak in natural code-switching Hinglish.',
      langCode: 'en-IN'
    },
    {
      id: 3,
      name: 'Vikram',
      langInfo: 'Indian English · Male · India',
      tone: 'Authoritative, executive',
      sampleText: 'Good afternoon. I am calling regarding your annual enterprise sales consultation schedule.',
      introText: 'Tap play to hear Vikram conduct an executive outbound dialer call.',
      langCode: 'en-IN'
    }
  ];

  const currentVoice = voiceList[activeVoiceIndex] || voiceList[0];

  const handlePrev = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveVoiceIndex((prev) => (prev === 0 ? voiceList.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveVoiceIndex((prev) => (prev === voiceList.length - 1 ? 0 : prev + 1));
  };

  const togglePlay = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentVoice.sampleText);
      utterance.lang = currentVoice.langCode;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi') || v.name.includes('Google'));
      if (matchedVoice) utterance.voice = matchedVoice;

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  }, [isPlaying, currentVoice]);

  const waveformBars = [
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 6, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 26, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 30, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 6, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 18, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 6, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 26, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 26, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 16, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 18, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 28, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 28, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 28, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 28, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 30, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 28, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 28, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 18, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 20, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 22, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 28, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 28, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 18, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 26, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 30, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 20, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 22, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#94A3B8]' },
    { h: 16, isDot: false, bg: 'bg-[#94A3B8]' },
    { h: 18, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 4, isDot: true, bg: 'bg-[#0F172A]' },
    { h: 30, isDot: false, bg: 'bg-[#0F172A]' },
    { h: 30, isDot: false, bg: 'bg-[#0F172A]' }
  ];

  return (
    <section className="w-full bg-[#F5F7FA] py-[40px] lg:py-[48px] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-[40px] lg:px-[60px] flex flex-col lg:flex-row items-center justify-between gap-[40px] lg:gap-[56px]">

        {/* Left Section 2 (585px width) */}
        <div className="w-full lg:w-[585px] flex flex-col gap-[24px] lg:gap-[32px]">
          <div className="space-y-[16px]">
            {/* Title */}
            <h2 className="font-outfit font-normal text-4xl sm:text-5xl lg:text-[56px] leading-[1.15] lg:leading-[66px] tracking-[-0.02em] text-[#0A0A0A]">
              Meet your prospects in the language they prefer.
            </h2>

            {/* Subtitle */}
            <p className="font-outfit font-normal text-base sm:text-lg lg:text-[18px] leading-[28px] text-[#6D8A96] max-w-[480px]">
              TeleBot helps your agents communicate naturally across languages, so language never becomes the reason a good opportunity gets missed.
            </p>
          </div>

          {/* Action Button */}
          <div>
            <button className="h-[48px] bg-[#1A936F] hover:bg-[#15795b] text-white font-outfit font-medium text-base px-6 rounded-[8px] flex items-center space-x-2 transition-all shadow-md active:scale-95">
              <span>Explore Languages</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Section 3 (Voice Cards Stack & Carousel) */}
        <div className="w-full lg:w-[700px] flex flex-col items-center justify-between gap-6 relative">

          {/* Overlapping Stack Deck Container with Framer Motion Animation */}
          <div className="relative w-full max-w-[700px] h-[460px] flex items-start overflow-visible">
            <AnimatePresence mode="sync">
              {voiceList.map((voice, index) => {
                const offset = (index - activeVoiceIndex + voiceList.length) % voiceList.length;
                if (offset > 2) return null; // Only render top 3 stacked cards

                const isCurrent = offset === 0;

                return (
                  <motion.div
                    key={voice.id}
                    className={`absolute left-0 top-0 w-full sm:w-[500px] lg:w-[520px] h-[460px] bg-white rounded-[16px] p-[24px] pb-[4px] border border-slate-200/90 flex flex-col justify-between ${isCurrent
                        ? 'shadow-[0_4px_30px_rgba(0,0,0,0.09)]'
                        : 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                      }`}
                    style={{ cursor: 'pointer' }}
                    initial={{ scale: 0.8, x: 50, opacity: 0 }}
                    animate={{
                      scale: 1 - offset * 0.08,
                      x: offset * 72,
                      zIndex: voiceList.length - offset,
                      opacity: 1 - offset * 0.2,
                    }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => {
                      if (!isCurrent) {
                        handleNext();
                      }
                    }}
                  >
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="w-[220px]">
                          <h3 className="w-[200px] h-[38px] font-outfit font-normal text-[30px] leading-[38px] text-[#0F172A] tracking-tight flex items-center">
                            {voice.name}
                          </h3>
                          <p className="w-[200px] h-[48px] font-outfit font-normal text-[16px] leading-[24px] text-[#6D8A96] mt-1 flex flex-col justify-center">
                            <span>{voice.langInfo}</span>
                            <span className="text-xs text-[#6D8A96]/80">{voice.tone}</span>
                          </p>
                        </div>

                        {/* Play Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCurrent) {
                              togglePlay();
                            } else {
                              handleNext();
                            }
                          }}
                          className={`w-[44px] h-[44px] rounded-[12px] border flex items-center justify-center transition-all ${isCurrent && isPlaying
                              ? 'bg-[#1A936F] text-white border-[#1A936F] shadow-md'
                              : 'border-[#CBD5E1] hover:border-[#1A936F] hover:bg-emerald-50 text-slate-800 bg-white shadow-sm'
                            }`}
                          aria-label="Play Voice Sample"
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-5 h-5 text-white stroke-[2]" />
                          ) : (
                            <Play className="w-5 h-5 text-slate-800 stroke-[1.75] ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Audio Waveform Visualizer */}
                      <div className="w-full max-w-[472px] h-[60px] bg-[#F8FAFC] border-[1.34px] border-[#E2E8F0] rounded-[12px] px-4 py-3 flex items-center justify-between gap-[3px]">
                        {waveformBars.map((bar, i) => (
                          <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${isCurrent && isPlaying ? 'bg-[#1A936F] animate-pulse' : bar.bg
                              }`}
                            style={{
                              width: '3.5px',
                              height:
                                isCurrent && isPlaying
                                  ? `${(bar.h * Math.sin(i + activeVoiceIndex)) % 32 + 8}px`
                                  : `${bar.h}px`,
                            }}
                          />
                        ))}
                      </div>

                      {/* Notice Box */}
                      <div className="w-full max-w-[472px] min-h-[90px] p-[16px] bg-[#F8FAFC] border-[1.34px] border-[#E2E8F0] rounded-[8px] flex items-center">
                        <p className="font-outfit font-normal text-[15px] leading-[22px] text-[#6D8A96]">
                          {voice.introText}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Section Card */}
                    <div className="w-full max-w-[472px] h-[48px] p-[8px] gap-[10px] border-t border-[#D4D4D4] flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) {
                            togglePlay();
                          } else {
                            handleNext();
                          }
                        }}
                        className="border-b border-[#1A1A1A] font-outfit font-medium text-[16px] leading-[24px] text-[#1A1A1A] text-center flex items-center justify-center hover:opacity-80 transition-all"
                      >
                        <span className="whitespace-nowrap leading-[24px] pb-0.5">
                          Interact with {voice.name.toLowerCase()}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Bottom Navigation Arrow Buttons */}
          <div className="w-full sm:w-[520px] flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-[#CBD5E1] flex items-center justify-center text-slate-700 hover:border-[#0A0A0A] hover:bg-slate-100 transition-all active:scale-95 bg-white shadow-sm"
              aria-label="Previous Voice"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-[#CBD5E1] flex items-center justify-center text-slate-700 hover:border-[#0A0A0A] hover:bg-slate-100 transition-all active:scale-95 bg-white shadow-sm"
              aria-label="Next Voice"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
