'use client';

import React, { useState } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';

export const VoiceEngineSection: React.FC = () => {
  const [activeVoice, setActiveVoice] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'regional' | 'global'>('all');

  const voices = [
    {
      id: 0,
      language: 'Hindi (हिंदी)',
      accent: 'North India Regional',
      provider: 'Regional Voice Engine',
      providerType: 'regional',
      gender: 'Female (Priya)',
      langCode: 'hi-IN',
      sampleText: 'नमस्ते राहुल जी, आपकी हेल्थ इंश्योरेंस पॉलिसी का रिन्यूअल बोनस एक्टिव हो गया है।',
      sampleRate: 'Clean Voice Stream'
    },
    {
      id: 1,
      language: 'Hinglish (Code-Switching)',
      accent: 'Indian Urban Metro',
      provider: 'Hinglish Speech Engine',
      providerType: 'regional',
      gender: 'Male (Rohan)',
      langCode: 'en-IN',
      sampleText: 'Hi Mr. Sharma! Aapki policy expiry 15th August ko hai. Shall I process the 10% discount now?',
      sampleRate: 'Clean Voice Stream'
    },
    {
      id: 2,
      language: 'Indian English',
      accent: 'Professional Sales Corporate',
      provider: 'Global Voice Engine',
      providerType: 'global',
      gender: 'Female (Rachel)',
      langCode: 'en-IN',
      sampleText: 'Good afternoon. I am calling from Star Health Insurance regarding your annual policy review.',
      sampleRate: 'Clean Voice Stream'
    },
    {
      id: 3,
      language: 'Tamil (தமிழ்)',
      accent: 'Chennai Regional',
      provider: 'Regional Voice Engine',
      providerType: 'regional',
      gender: 'Female (Kavitha)',
      langCode: 'ta-IN',
      sampleText: 'வணக்கம், உங்கள் ஹெல்த் பாலிசி புதுப்பித்தல் சலுகைகள் தயாராக உள்ளன.',
      sampleRate: 'Clean Voice Stream'
    },
    {
      id: 4,
      language: 'Telugu (తెలుగు)',
      accent: 'Hyderabad Regional',
      provider: 'Regional Voice Engine',
      providerType: 'regional',
      gender: 'Male (Kalyan)',
      langCode: 'te-IN',
      sampleText: 'నమస్కారం, మీ హెల్త్ ఇన్సూరెన్స్ పాలసీ రెన్యూవల్ బోనస్ యాక్టివ్ చేయబడింది.',
      sampleRate: 'Clean Voice Stream'
    },
    {
      id: 5,
      language: 'Marathi (मराठी)',
      accent: 'Mumbai/Pune Regional',
      provider: 'Regional Voice Engine',
      providerType: 'regional',
      gender: 'Female (Ananya)',
      langCode: 'mr-IN',
      sampleText: 'नमस्कार, तुमच्या हेल्थ इन्शुरन्स पॉलिसीचे नूतनीकरण बोनस सक्रिय केले आहे.',
      sampleRate: 'Clean Voice Stream'
    }
  ];

  const filteredVoices = voices.filter(
    (v) => selectedProvider === 'all' || v.providerType === selectedProvider
  );

  const togglePlay = (id: number, text: string, langCode: string) => {
    if (activeVoice === id && isPlaying) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setActiveVoice(null);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.95;

        utterance.onend = () => {
          setIsPlaying(false);
          setActiveVoice(null);
        };

        window.speechSynthesis.speak(utterance);
      }
      setActiveVoice(id);
      setIsPlaying(true);
    }
  };

  return (
    <section id="multilingual" className="py-24 bg-slate-50 border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold font-mono uppercase tracking-widest text-amber-800 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            Multilingual Voice AI Engine
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 font-display uppercase leading-tight">
            SPEAKING EVERY LANGUAGE<br />
            <span className="text-amber-500 font-display uppercase block mt-1">THAT MATTERS.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Switch seamlessly between global English and regional Indian languages with natural Hinglish code-switching.
          </p>

          {/* Provider Filter Toggle */}
          <div className="pt-4 flex items-center justify-center space-x-2">
            <button
              onClick={() => setSelectedProvider('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedProvider === 'all'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Voice Models ({voices.length})
            </button>
            <button
              onClick={() => setSelectedProvider('regional')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedProvider === 'regional'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Regional Indian Voices
            </button>
            <button
              onClick={() => setSelectedProvider('global')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedProvider === 'global'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Global Voices
            </button>
          </div>
        </div>

        {/* Voices Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVoices.map((v) => {
            const isThisPlaying = activeVoice === v.id && isPlaying;
            return (
              <div
                key={v.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  isThisPlaying
                    ? 'bg-white border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-widest block">
                        {v.provider}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">{v.language}</h3>
                    </div>

                    <button
                      onClick={() => togglePlay(v.id, v.sampleText, v.langCode)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                        isThisPlaying
                          ? 'bg-amber-500 text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-500 hover:text-white'
                      }`}
                    >
                      {isThisPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center space-x-2 mb-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                      {v.gender}
                    </span>
                    <span>•</span>
                    <span>{v.accent}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic leading-relaxed">
                    &quot;{v.sampleText}&quot;
                  </div>
                </div>

                {/* Animated Waveform indicator when playing */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <Volume2 className={`w-4 h-4 ${isThisPlaying ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
                    <span className="font-mono text-[11px]">{v.sampleRate}</span>
                  </div>

                  {isThisPlaying ? (
                    <div className="flex items-center space-x-1">
                      {[30, 80, 50, 90, 40, 70].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-amber-500 rounded-full animate-pulse"
                          style={{ height: `${h}%`, minHeight: '8px' }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Click Play to Listen</span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
