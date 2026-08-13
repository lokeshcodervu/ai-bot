'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Check,
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  Users,
  Megaphone,
  PhoneCall,
  Star,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react';

const VOICE_PRESETS = [1, 2, 3, 5, 10, 20, 50];
const CAMPAIGN_PRESETS = [1, 5, 10, 25, 50, 100];
const CALL_MINUTES_PRESETS = [100, 1500, 3000, 5000, 10000, 50000];

const PRESET_FREE_PERKS = [
  '1 Free AI Voice',
  '100 Free Call Minutes',
  '2 AI Voice Clones',
  '1,500 Call Minutes/mo',
  '5 Premium AI Voices',
  '10,000 Call Minutes/mo',
  'Live Audio Monitoring',
  'Community Email Support',
  '24/7 Priority Support',
  'Dedicated Account Manager'
];

const PRESET_FEATURES = [
  'Full AI Voice Clone access',
  'Simultaneous Call Campaigns',
  'Included Call Minutes / month',
  'Real-time Live Audio Monitor',
  'Priority 24/7 Phone & Email Support',
  'Custom RAG Knowledgebase',
  'SSO & SLA Guarantees',
  'Custom Webhooks & CRM Integration'
];

export default function CreateSubscriptionPlanPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('₹3,999');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [maxVoices, setMaxVoices] = useState<number>(3);
  const [maxCampaigns, setMaxCampaigns] = useState<number>(10);
  const [maxCalls, setMaxCalls] = useState<number>(3000);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isPopular, setIsPopular] = useState<boolean>(false);

  // Perks list
  const [perks, setPerks] = useState<string[]>([
    '3 AI Voices included',
    '10 Campaigns slot',
    '3,000 Call Minutes/mo'
  ]);
  const [customPerk, setCustomPerk] = useState('');

  // Features list
  const [features, setFeatures] = useState<string[]>([
    '3 AI Voices access',
    '10 Active Campaigns',
    '3,000 Included Call Minutes',
    'Standard Email Support'
  ]);
  const [customFeature, setCustomFeature] = useState('');

  // Add / Toggle Perks
  const togglePresetPerk = (perk: string) => {
    if (perks.includes(perk)) {
      setPerks(perks.filter(p => p !== perk));
    } else {
      setPerks([...perks, perk]);
    }
  };

  const addCustomPerk = () => {
    if (customPerk.trim() && !perks.includes(customPerk.trim())) {
      setPerks([...perks, customPerk.trim()]);
      setCustomPerk('');
    }
  };

  const removePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  // Add / Toggle Features
  const togglePresetFeature = (feature: string) => {
    if (features.includes(feature)) {
      setFeatures(features.filter(f => f !== feature));
    } else {
      setFeatures([...features, feature]);
    }
  };

  const addCustomFeature = () => {
    if (customFeature.trim() && !features.includes(customFeature.trim())) {
      setFeatures([...features, customFeature.trim()]);
      setCustomFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Save Plan
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a Plan Name.');
      return;
    }
    if (!price.trim()) {
      alert('Please enter a display price.');
      return;
    }

    alert(`Subscription plan '${name.trim()}' created successfully! Redirecting to plans list.`);
    router.push('/dashboard/subscriptions-plans');
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in font-outfit p-2 md:p-4 max-w-5xl mx-auto">

      {/* BACK BUTTON & PAGE HEADER */}
      <div className="page-header-card justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/subscriptions-plans')}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Back to Plans"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-header-title">
              Create New Subscription Plan
            </h1>
            <p className="light-text mt-0.5">
              Super Admin: Define plan pricing, limits, free offered perks, and feature highlights.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/subscriptions-plans')}
          className="flex items-center text-xs font-bold px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-outfit"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1: BASIC PLAN DETAILS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Plan Identity & Pricing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Plan Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Growth Pro Plan"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Display Price & Billing Cycle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Price *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. ₹3,999 or $49"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400"
                />
                
                {/* Billing Cycle Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'monthly' ? 'bg-black text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      billingCycle === 'yearly' ? 'bg-black text-white shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 font-bold text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-0"
              />
              <span>Active Plan (Visible for Selection)</span>
            </label>

            <label className="flex items-center space-x-2 font-bold text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={e => setIsPopular(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
              />
              <span className="flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Mark as &apos;Most Popular&apos; Badge</span>
              </span>
            </label>
          </div>
        </div>

        {/* SECTION 2: CLICKABLE PLAN LIMITS & PRESETS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Zap className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900">Clickable Plan Resource Limits</h2>
          </div>

          {/* 1. Max AI Voices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Max AI Voices Included:</span>
              </label>
              <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {maxVoices} Voices
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {VOICE_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaxVoices(preset)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    maxVoices === preset
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset} {preset === 1 ? 'Voice' : 'Voices'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Max Campaigns */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Megaphone className="w-4 h-4 text-slate-500" />
                <span>Max Active Campaigns:</span>
              </label>
              <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {maxCampaigns} Campaigns
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {CAMPAIGN_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaxCampaigns(preset)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    maxCampaigns === preset
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset} {preset === 1 ? 'Campaign' : 'Campaigns'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Max Monthly Call Minutes */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <PhoneCall className="w-4 h-4 text-slate-500" />
                <span>Max Monthly Call Minutes:</span>
              </label>
              <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                {maxCalls.toLocaleString()} Minutes / mo
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              {CALL_MINUTES_PRESETS.map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMaxCalls(preset)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    maxCalls === preset
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.toLocaleString()} Mins
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: FREE OFFERED PERKS & HIGHLIGHTS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900">Free Offered Perks & Feature Highlights</h2>
          </div>

          {/* Free Offered Perks */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Free Offered Perks (Clickable Presets & Custom Tags)
            </label>

            {/* Clickable Preset Chips */}
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              {PRESET_FREE_PERKS.map(preset => {
                const isSelected = perks.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePresetPerk(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{preset}</span>
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Perks List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Selected Perks ({perks.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {perks.map((perk, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold"
                  >
                    <span>✓ {perk}</span>
                    <button
                      type="button"
                      onClick={() => removePerk(idx)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Perk Input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={customPerk}
                onChange={e => setCustomPerk(e.target.value)}
                placeholder="Add custom perk (e.g. Free Setup Assistance)"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
              <button
                type="button"
                onClick={addCustomPerk}
                className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                Add Perk
              </button>
            </div>
          </div>

          {/* Features Highlight List */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              Feature Highlights List (Clickable Presets & Custom Tags)
            </label>

            {/* Clickable Preset Chips */}
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              {PRESET_FEATURES.map(preset => {
                const isSelected = features.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePresetFeature(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{preset}</span>
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Features List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Selected Features ({features.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <span>• {feat}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Custom Feature Input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={customFeature}
                onChange={e => setCustomFeature(e.target.value)}
                placeholder="Add custom feature (e.g. Dedicated IP)"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
              <button
                type="button"
                onClick={addCustomFeature}
                className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
              >
                Add Feature
              </button>
            </div>
          </div>

        </div>

        {/* SUBMIT BUTTON ROW */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/subscriptions-plans')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Publish New Subscription Plan
          </button>
        </div>

      </form>

    </div>
  );
}
