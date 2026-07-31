'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  Save, 
  Upload, 
  Trash2, 
  FileText, 
  Play, 
  Phone, 
  Mic, 
  BookOpen, 
  MessageSquare, 
  Wrench, 
  User, 
  CheckCircle2, 
  Globe, 
  Clock 
} from 'lucide-react';

import API_BASE from '../../../config/api';

interface VoiceCard {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  locale: string;
  description: string;
  previewUrl?: string;
}

const VOICE_OPTIONS: VoiceCard[] = [
  { id: 'v-neha', name: 'Neha', gender: 'Female', locale: 'en-IN', description: 'Warm, professional' },
  { id: 'v-arjun', name: 'Arjun', gender: 'Male', locale: 'en-IN', description: 'Confident, clear' },
  { id: 'v-aria', name: 'Aria', gender: 'Female', locale: 'en-US', description: 'Friendly, upbeat' },
  { id: 'v-raj', name: 'Raj', gender: 'Male', locale: 'en-IN', description: 'Conversational hindi' }
];

export default function SettingsPage() {
  const { token } = useStore();

  // Active tab selection matching Figma tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'voice' | 'kb' | 'prompt' | 'tools' | 'test'>('profile');

  // AI Ready status state
  const [isAiReady, setIsAiReady] = useState(true);

  // Company Profile Settings state
  const [companyName, setCompanyName] = useState('CoderVu Institute');
  const [website, setWebsite] = useState('codervu.com');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [customGreeting, setCustomGreeting] = useState('');

  // Voice configurations
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('v-neha');
  const [voices, setVoices] = useState<VoiceCard[]>([]);
  const [ttsProvider, setTtsProvider] = useState<'ELEVENLABS' | 'SARVAM'>('ELEVENLABS');

  // Knowledge Base RAG state
  const [kbFiles, setKbFiles] = useState<{ id: string; name: string; size: string; status: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingKb, setIsLoadingKb] = useState(false);

  // System Prompt state
  const [systemPrompt, setSystemPrompt] = useState('');
  const [promptVersion, setPromptVersion] = useState(1);

  // Twilio credentials state
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [isSavingTwilio, setIsSavingTwilio] = useState(false);

  // Test Call state
  const [testNumber, setTestNumber] = useState('');
  const [testCallStatus, setTestCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'completed'>('idle');
  const [dialTimer, setDialTimer] = useState(0);
  const [isDialing, setIsDialing] = useState(false);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // Fetch all settings data
  const loadData = async () => {
    if (!token) return;
    setIsLoadingProfile(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      };

      // Fetch profile
      const profileRes = await fetch(`${API_BASE}/tenant/profile`, { headers });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCompanyName(profile.company_name || 'CoderVu Institute');
        setTimezone(profile.timezone || 'Asia/Kolkata');
        setSystemPrompt(profile.system_prompt || '');
        setPromptVersion(profile.system_prompt_version || 1);
        setSelectedVoiceId(profile.voice_id || 'v-neha');
        setTwilioPhone(profile.twilio_phone_number || '');
        if (profile.settings) {
          if (profile.settings.tts_provider) {
            setTtsProvider(profile.settings.tts_provider);
          }
          if (profile.settings.custom_greeting) {
            setCustomGreeting(profile.settings.custom_greeting);
          }
        }
      }

      // Fetch Elevenlabs voice models
      const voicesRes = await fetch(`${API_BASE}/tenant/voices`, { headers });
      if (voicesRes.ok) {
        const voicesData = await voicesRes.json();
        const mappedVoices = voicesData.map((v: any) => ({
          id: v.voice_id,
          name: v.name,
          gender: v.gender ? (v.gender.charAt(0).toUpperCase() + v.gender.slice(1)) : 'Female',
          locale: v.locale || 'en-US',
          description: v.preview_url ? 'ElevenLabs premium voice' : 'Standard synthesized voice',
          previewUrl: v.preview_url
        }));
        setVoices(mappedVoices);
      } else {
        setVoices(VOICE_OPTIONS);
      }

      // Fetch knowledge files
      await fetchKbFiles();
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchKbFiles = async () => {
    if (!token) return;
    setIsLoadingKb(true);
    try {
      const res = await fetch(`${API_BASE}/admin/knowledge/files`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const docs = await res.json();
        const mapped = docs.map((doc: any) => ({
          id: doc.id,
          name: doc.file_name,
          size: '1.2 MB',
          status: doc.status || 'COMPLETED'
        }));
        setKbFiles(mapped);
      }
    } catch (err) {
      console.error("Error loading knowledge files:", err);
    } finally {
      setIsLoadingKb(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Company Profile saver
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/tenant/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          company_name: companyName,
          timezone: timezone,
          settings: {
            tts_provider: ttsProvider,
            website: website,
            custom_greeting: customGreeting
          }
        })
      });

      if (res.ok) {
        alert('Company Profile saved successfully!');
      } else {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save company profile.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error saving company profile: ${err.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Select Premium AI Voice
  const handleSelectVoice = async (voiceId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/tenant/select-voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ voice_id: voiceId })
      });

      if (res.ok) {
        setSelectedVoiceId(voiceId);
        alert('Voice choice updated successfully!');
      } else {
        const data = await res.json();
        alert(`Failed to save voice: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating voice selection.');
    }
  };

  // Vector KB Upload handler
  const handleUploadKB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && token) {
      const file = e.target.files[0];
      setIsUploading(true);

      const formData = new FormData();
      formData.append('files', file);

      try {
        const res = await fetch(`${API_BASE}/tenant/upload-kb`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
          body: formData
        });

        if (res.ok) {
          alert(`Document "${file.name}" uploaded successfully! Vector processing started in the background.`);
          fetchKbFiles();
        } else {
          const data = await res.json();
          throw new Error(data.detail || 'Failed to upload document.');
        }
      } catch (err: any) {
        console.error(err);
        alert(`Error uploading document: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteKB = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this document from the knowledge base?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/knowledge/files/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (res.ok) {
        alert('Document deleted from knowledge base successfully.');
        fetchKbFiles();
      } else {
        const data = await res.json();
        alert(`Failed to delete document: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting document.');
    }
  };

  // System Prompt Customization
  const handleSavePrompt = async () => {
    if (!token) return;
    setIsSavingPrompt(true);
    try {
      const res = await fetch(`${API_BASE}/tenant/system-prompt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ system_prompt: systemPrompt })
      });

      if (res.ok) {
        const data = await res.json();
        setPromptVersion(data.system_prompt_version);
        alert(`System prompt version v${data.system_prompt_version} saved and active!`);
      } else {
        const data = await res.json();
        alert(`Failed to save prompt: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving system prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Twilio credentials saver
  const handleSaveTwilio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingTwilio(true);
    try {
      const res = await fetch(`${API_BASE}/tenant/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          twilio_account_sid: twilioSid,
          twilio_auth_token: twilioToken,
          twilio_phone_number: twilioPhone
        })
      });

      if (res.ok) {
        alert('✅ Twilio Credentials verified and saved successfully!');
        setTwilioSid('');
        setTwilioToken('');
        loadData();
      } else {
        const data = await res.json();
        alert(`Failed to save Twilio: ${data.detail || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving Twilio credentials.');
    } finally {
      setIsSavingTwilio(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">

      {/* TOP HEADER CONTAINER MATCHING FIGMA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit text-slate-900 tracking-tight">AI Configuration</h1>
        </div>

        {/* Top-Right Mark AI Ready Action Button */}
        <button
          onClick={() => setIsAiReady(!isAiReady)}
          className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer shadow-sm ${
            isAiReady
              ? 'bg-[#059669] hover:bg-[#047857] text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isAiReady ? 'Mark AI Ready' : 'Enable AI Engine'}</span>
        </button>
      </div>

      {/* SUB-NAVIGATION TAB BAR MATCHING FIGMA */}
      <div className="bg-white px-6 py-2 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-8 overflow-x-auto custom-scrollbar">
        {[
          { id: 'profile', label: 'Company Profile', icon: User },
          { id: 'voice', label: 'Voice', icon: Mic },
          { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
          { id: 'prompt', label: 'Prompt', icon: MessageSquare },
          { id: 'tools', label: 'Tools', icon: Wrench },
          { id: 'test', label: 'Test Call', icon: Play },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 text-xs font-bold transition-all relative border-b-2 ${
                isActive
                  ? 'border-black text-slate-950 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-6">

        {/* ========================================================================= */}
        {/* TAB 1: COMPANY PROFILE MATCHING FIGMA DESIGN EXACTLY */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Field 1: Company name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="CoderVu Institute"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium text-slate-900 shadow-2xs transition-colors"
                />
              </div>

              {/* Field 2: Website */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="codervu.com"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium text-slate-900 shadow-2xs transition-colors"
                />
              </div>

              {/* Field 3: Timezone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timezone</label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-medium text-slate-900 shadow-2xs appearance-none cursor-pointer pr-10"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    ▼
                  </div>
                </div>
              </div>


              {/* Submit Button: Save Changes */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* TAB 2: VOICE */}
        {activeTab === 'voice' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {voices.map((voice) => {
                const isSelected = voice.id === selectedVoiceId;
                return (
                  <div
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={`bg-white p-5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all duration-150 ${
                      isSelected 
                        ? 'border-black bg-slate-50/20 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{voice.name}</span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {voice.gender} • {voice.locale}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{voice.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Synthesizing sample audio preview for voice ${voice.name}...`);
                      }}
                      className="h-10 w-10 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center transition-colors border border-slate-200/40"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: KNOWLEDGE BASE */}
        {activeTab === 'kb' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Knowledge Base Documents</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload PDF documents for RAG context during dialer calls</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-4 flex flex-col justify-center items-center">
                <Upload className="h-8 w-8 text-black" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">Drag files here, or click to upload</p>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF up to 5MB</p>
                </div>
                
                <label className="cursor-pointer py-2 px-4 bg-slate-50 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 transition-colors shadow-2xs">
                  {isUploading ? 'Vector Indexing...' : 'Browse Documents'}
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleUploadKB} 
                    disabled={isUploading} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured RAG Docs</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {isLoadingKb ? (
                    <p className="text-center text-slate-400 py-8">Loading documents...</p>
                  ) : kbFiles.map((file) => (
                    <div key={file.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{file.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-100">
                          {file.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteKB(file.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!isLoadingKb && kbFiles.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No knowledge documents configured yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROMPT */}
        {activeTab === 'prompt' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Persona & Custom Prompts</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure agent rules and behavior during conversations</p>
              </div>
              <span className="text-xs font-bold text-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                Active Version: v{promptVersion}
              </span>
            </div>

            <div className="space-y-4">
              <textarea
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm font-medium font-mono bg-slate-50/50"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt}
                  className="flex items-center justify-center py-2.5 px-6 bg-black hover:bg-[#1f2937] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" /> {isSavingPrompt ? 'Saving...' : 'Save Prompt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TOOLS */}
        {activeTab === 'tools' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Twilio Telephony & Webhooks</h3>
                <p className="text-xs text-slate-500 mt-0.5">Connect Twilio account credentials for real phone calls</p>
              </div>
            </div>

            <form onSubmit={handleSaveTwilio} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account SID</label>
                <input
                  type="text"
                  required
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm font-mono bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Auth Token</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm font-mono bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Twilio Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+15105183920"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm font-mono bg-slate-50/50"
                />
              </div>

              <div className="md:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTwilio}
                  className="px-6 py-3 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {isSavingTwilio ? 'Saving Credentials...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: TEST CALL */}
        {activeTab === 'test' && (
          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Test AI Voice Dialer</h3>
              <p className="text-xs text-slate-500 mt-0.5">Test real outbound call to your mobile number</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="+919876543210"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 text-sm font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => alert(`Initiating test call to ${testNumber || '+919876543210'}...`)}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" />
                <span>Start Test Call</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
