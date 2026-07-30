'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, ArrowRight, Volume2, VolumeX, Bot, Database, CheckCircle2, Mic } from 'lucide-react';

interface HeroSectionProps {
  onOpenAuthModal: (mode: 'signin' | 'signup') => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuthModal }) => {
  const [callState, setCallState] = useState<'idle' | 'active'>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const callSimulationScript = [
    { sender: 'AI Voice Agent', text: 'Hello Mr. Sharma, this is Priya calling from Star Health Insurance. Am I speaking with Rahul?', delay: 'Live Voice Processing' },
    { sender: 'Customer', text: 'Yes speaking. What is this call regarding?', delay: 'Customer Audio' },
    { sender: 'AI Voice Agent', text: 'I noticed your Family Health Optima policy is due for renewal on August 15th. Would you like me to lock in your 10% no-claim discount?', delay: 'Policy Context Grounded' },
    { sender: 'Customer', text: 'Can I add my parents to this policy rider?', delay: 'Customer Audio' },
    { sender: 'AI Voice Agent', text: 'Yes! Under Section 4.2 of your handbook, senior citizen riders can be added with 0% waiting period. Shall I send the updated quote to your WhatsApp?', delay: 'Verified Handbook Policy' }
  ];

  // Speech synthesis helper
  const speakText = useCallback((text: string, isAi: boolean) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    if (isAi) {
      const femaleVoice = voices.find((v) => v.name.includes('Google') || v.name.includes('Zira') || v.name.includes('Priya') || v.name.includes('Female') || v.lang.includes('en'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.15;
      utterance.rate = 1.0;
    } else {
      const maleVoice = voices.find((v) => v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Male') || v.lang.includes('en'));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (callState === 'active') {
      const current = callSimulationScript[activeStep];
      if (current) {
        speakText(current.text, current.sender === 'AI Voice Agent');
      }

      interval = setInterval(() => {
        setActiveStep((prev) => {
          const nextStep = (prev + 1) % callSimulationScript.length;
          const nextItem = callSimulationScript[nextStep];
          if (nextItem) {
            speakText(nextItem.text, nextItem.sender === 'AI Voice Agent');
          }
          return nextStep;
        });
      }, 4200);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callState, activeStep, speakText]);

  const toggleCall = () => {
    if (callState === 'idle') {
      setCallState('active');
      setActiveStep(0);
    } else {
      setCallState('idle');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-white border-b border-slate-100 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">

            {/* Tagline Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>TeleBot AI Telephony Platform</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">Ultra-Low Latency Streaming</span>
            </div>

            {/* Headline matching image style: Condensed All-Caps + Warm Amber highlight */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.0] text-slate-900 font-display uppercase">
              AUTOMATE. QUALIFY. CONVERT.<br />
              <span className="text-amber-500 font-display uppercase block mt-1">
                AI Handles Every Call.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Deploy human-sounding conversational voice AI agents that handle outbound lead dialing, verified policy counseling, and automated CRM updates seamlessly.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={toggleCall}
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-base shadow-sm transition-all flex items-center justify-center space-x-2.5"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${callState === 'active' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                <span>{callState === 'idle' ? 'Try Interactive AI Voice Call' : 'Stop Voice Call'}</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-semibold">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% TRAI DND Compliant</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Voice Streaming</span>
              </div>
            </div>

          </div>

          {/* Right Hero Screenshot / Live Call Monitor */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/80 p-5 space-y-4">

              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <span className="ml-2 text-xs font-mono font-medium text-slate-500">TeleBot AI Agent Monitor</span>
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{callState === 'active' ? 'Call Active (00:24)' : 'Agent Standby'}</span>
                </div>
              </div>

              {/* Call Control Bar */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    P
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Priya (Health Counseling AI)</div>
                    <div className="text-[11px] text-slate-500 font-mono">Secured Telephony Stream</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute Speech Audio' : 'Mute Speech Audio'}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-all ${isMuted ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleCall}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${callState === 'active'
                        ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                  >
                    {callState === 'active' ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Audio Wave + Live Speaker Indicator Bar */}
              <div className="py-2.5 px-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-mono font-medium">
                  {callState === 'active' ? (
                    callSimulationScript[activeStep]?.sender === 'AI Voice Agent' ? (
                      <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                        <Volume2 className="w-4 h-4 animate-bounce" />
                        <span>Speaking: Priya</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                        <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Speaking: Customer (Rahul)</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Volume2 className="w-4 h-4" />
                      <span>Encrypted Voice Stream</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {[40, 70, 30, 90, 60, 100, 50, 80].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-300 ${callState === 'active'
                          ? callSimulationScript[activeStep]?.sender === 'AI Voice Agent'
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-emerald-600 animate-pulse'
                          : 'bg-slate-300 opacity-40'
                        }`}
                      style={{
                        height: callState === 'active' ? `${(h * Math.sin(i + activeStep)) % 24 + 8}px` : '4px'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live Transcript Stream */}
              <div className="space-y-2.5 min-h-[200px] max-h-[230px] overflow-y-auto pr-1 text-xs">
                {callState === 'idle' ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Bot className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Click &quot;Try Interactive AI Voice Call&quot; to listen</p>
                    <p className="text-[11px] text-slate-500 mt-1">Live Audio Speech Synthesis (AI + Customer Dialogues)</p>
                  </div>
                ) : (
                  callSimulationScript.slice(0, activeStep + 1).map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-all ${item.sender === 'AI Voice Agent'
                          ? 'bg-amber-50/80 border border-amber-200 text-slate-900 ml-2'
                          : 'bg-slate-100 border border-slate-200 text-slate-800 mr-2'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[11px] text-amber-700">{item.sender}</span>
                          {idx === activeStep && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500 text-white animate-pulse">
                              NOW SPEAKING 🔊
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {item.delay}
                        </span>
                      </div>
                      <p className="leading-relaxed">{item.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Verified Policy Knowledge Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-500" />
                  <span>Active Policy Knowledge: <strong className="text-slate-800">insurance-policy-v2</strong></span>
                </div>
                <div className="text-emerald-600 font-semibold">99.4% Pitch Accuracy</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
