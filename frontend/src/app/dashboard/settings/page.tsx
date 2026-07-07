'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { 
  Save, 
  Volume2, 
  Upload, 
  Trash2, 
  Lock, 
  CheckCircle, 
  FileText, 
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
  Phone,
  PhoneOff,
  Mic,
  BookOpen,
  MessageSquare,
  Wrench,
  X,
  ShieldAlert
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1`
  : 'http://localhost:8000/api/v1');

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

export default function AiConfigurationPage() {
  const { token } = useStore();

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'voice' | 'kb' | 'prompt' | 'tools' | 'test'>('voice');

  // Voice configurations
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('v-neha');
  const [voices, setVoices] = useState<VoiceCard[]>([]);

  // Company Settings configuration
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [ttsProvider, setTtsProvider] = useState<'ELEVENLABS' | 'SARVAM'>('ELEVENLABS');

  // Knowledge Base RAG state
  const [kbFiles, setKbFiles] = useState<{ id: string; name: string; size: string; status: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingKb, setIsLoadingKb] = useState(false);
  const [vectorStatus, setVectorStatus] = useState<string>('COMPLETED');

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
        setCompanyName(profile.company_name || '');
        setTimezone(profile.timezone || 'Asia/Kolkata');
        setSystemPrompt(profile.system_prompt || '');
        setPromptVersion(profile.system_prompt_version || 1);
        setSelectedVoiceId(profile.voice_id || '');
        setTwilioPhone(profile.twilio_phone_number || '');
        if (profile.settings && profile.settings.tts_provider) {
          setTtsProvider(profile.settings.tts_provider);
        } else {
          setTtsProvider('ELEVENLABS');
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
          size: '1.2 MB', // Mock file size placeholder
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

  // Poll vector status if any file is in PROCESSING status
  useEffect(() => {
    const hasProcessing = kbFiles.some(f => f.status === 'PROCESSING');
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/tenant/vector-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setVectorStatus(data.status);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(interval);
            fetchKbFiles(); // refresh list
          }
        }
      } catch (err) {
        console.error("Error polling vector status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [kbFiles, token]);

  // Test Call timer hook
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testCallStatus === 'dialing') {
      interval = setInterval(() => {
        setTestCallStatus('connected');
        setDialTimer(0);
      }, 3000);
    } else if (testCallStatus === 'connected') {
      interval = setInterval(() => {
        setDialTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testCallStatus]);

  // Voice Preview player
  const handlePlayPreview = (name: string, previewUrl?: string) => {
    if (previewUrl) {
      const audio = new Audio(previewUrl);
      audio.play().catch(e => {
        console.error("Error playing audio preview:", e);
        alert(`Synthesized audio preview for voice model ${name} could not be loaded.`);
      });
    } else {
      alert(`Playing synthesized audio preview for voice model ${name}...`);
    }
  };

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
            tts_provider: ttsProvider
          }
        })
      });

      if (res.ok) {
        alert('Calling context settings saved successfully!');
      } else {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to save calling context.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error saving calling context: ${err.message}`);
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
        loadData(); // reload profile variables
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

  // Test Call Trigger
  const handleTriggerTestCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber.trim() || !token) {
      alert('Please enter a valid phone number.');
      return;
    }
    setIsDialing(true);
    try {
      // 1. Create a temporary test lead
      const importRes = await fetch(`${API_BASE}/leads/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          leads: [
            {
              name: 'Test Dialer User',
              phone: testNumber,
              notes: 'Triggered via Settings Test Call'
            }
          ]
        })
      });

      if (!importRes.ok) {
        const errData = await importRes.json();
        throw new Error(errData.detail || 'Failed to create test lead.');
      }

      const importData = await importRes.json();
      if (!importData.imported_leads || importData.imported_leads.length === 0) {
        throw new Error('Test lead could not be created.');
      }

      const leadId = importData.imported_leads[0];

      // 2. Call the single lead
      const callRes = await fetch(`${API_BASE}/telephony/call-lead/${leadId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (callRes.ok) {
        const callData = await callRes.json();
        alert(callData.message || 'Test call triggered successfully!');
        setTestCallStatus('dialing');
      } else {
        const errData = await callRes.json();
        throw new Error(errData.detail || 'Failed to trigger outbound call.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error executing test call.');
    } finally {
      setIsDialing(false);
    }
  };

  const handleEndTestCall = () => {
    setTestCallStatus('completed');
    setTimeout(() => {
      setTestCallStatus('idle');
      setTestNumber('');
    }, 1500);
  };

  const getTimerDisplay = () => {
    const m = Math.floor(dialTimer / 60).toString().padStart(2, '0');
    const s = (dialTimer % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* HEADER ROW WITH TABS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-outfit text-slate-900 tracking-tight">AI Configuration</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Fine-tune outbound voice models, prompts, and knowledge settings</p>
        </div>

        {/* Tab Controls Bar */}
        <div className="flex flex-wrap items-center bg-slate-100/60 p-1.5 rounded-xl border border-slate-200/40">
          {[
            { id: 'voice', label: 'Voice', icon: Mic },
            { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
            { id: 'prompt', label: 'Prompt', icon: MessageSquare },
            { id: 'tools', label: 'Tools', icon: Wrench },
            { id: 'test', label: 'Test Call', icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center text-xs font-bold px-4 py-2 rounded-lg transition-all border ${
                  isActive 
                    ? 'bg-white border-slate-200 text-black shadow-2xs' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="space-y-6">
        
        {/* 1. VOICE TAB PANEL */}
        {activeTab === 'voice' && (
          <div className="space-y-6 animate-fade-in">
            {/* Voices Grid */}
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
                        : 'border-slate-200/80 hover:border-slate-300'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(voice.name, voice.previewUrl);
                      }}
                      className="h-10 w-10 shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center transition-colors border border-slate-200/40"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Company profile settings inside Voice tab */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-base font-bold font-outfit text-slate-900">Calling Context Settings</h3>
                <p className="text-xs text-slate-500">Configure global timezone, fallback languages, and voice engine providers</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold cursor-pointer"
                    >
                      <option value="Asia/Kolkata">India (IST - UTC +5:30)</option>
                      <option value="America/New_York">US Eastern (EST - UTC -5:00)</option>
                      <option value="Europe/London">London (GMT - UTC +0:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">TTS Voice Provider</label>
                    <select
                      value={ttsProvider}
                      onChange={(e) => setTtsProvider(e.target.value as any)}
                      className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-sm font-semibold cursor-pointer"
                    >
                      <option value="ELEVENLABS">ElevenLabs (Default)</option>
                      <option value="SARVAM">Sarvam AI (Indian Voices)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center justify-center py-2 px-5 bg-black hover:bg-[#1f2937] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Save className="h-4 w-4 mr-2" /> {isSavingProfile ? 'Saving...' : 'Save Context'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. KNOWLEDGE BASE TAB PANEL */}
        {activeTab === 'kb' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold font-outfit text-slate-900">Knowledge Base RAG Documents</h3>
              <p className="text-xs text-slate-500">Upload PDF files for the AI to query dynamically during dialer calls</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Card */}
              <div className="border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-4 flex flex-col justify-center items-center">
                <Upload className="h-8 w-8 text-black" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">Drag files here, or click to upload</p>
                  <p className="text-xs text-slate-500 mt-1">Support PDF documents up to 5MB</p>
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

              {/* Uploaded Files list */}
              <div className="lg:col-span-2 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configured RAG Docs</p>
                
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {isLoadingKb ? (
                    <p className="text-center text-slate-400 py-8">Loading documents...</p>
                  ) : kbFiles.map((file) => (
                    <div key={file.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{file.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          file.status === 'PROCESSING' 
                            ? 'text-amber-600 bg-amber-50 border-amber-100 animate-pulse'
                            : file.status === 'FAILED'
                            ? 'text-red-500 bg-red-50 border-red-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                        }`}>
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

        {/* 3. PROMPT TAB PANEL */}
        {activeTab === 'prompt' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold font-outfit text-slate-900">AI Persona & Custom Prompts</h3>
                <p className="text-xs text-slate-500">Configure how the agent behaves and qualifies prospects during conversation</p>
              </div>
              <span className="text-xs font-bold text-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                Active Version: v{promptVersion}
              </span>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-medium font-mono bg-slate-50/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-md">
                  Every save will increment prompt version count. Changes will apply to all future calls.
                </p>
                <button
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt}
                  className="flex items-center justify-center py-2 px-5 bg-black hover:bg-[#1f2937] text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" /> {isSavingPrompt ? 'Saving...' : 'Increment & Save Prompt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. TOOLS TAB PANEL */}
        {activeTab === 'tools' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Phone className="h-4.5 w-4.5 text-slate-700" />
                  <h3 className="text-base font-bold font-outfit text-slate-900">Twilio Outbound Calling</h3>
                </div>
                <p className="text-xs text-slate-500">Connect your Twilio account to place real AI-powered phone calls</p>
              </div>
              
              <span className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                {twilioPhone ? 'Credentials Active' : 'Simulation Mode'}
              </span>
            </div>

            <form onSubmit={handleSaveTwilio} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Account SID</label>
                <input
                  type="text"
                  required
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black text-sm font-mono bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Auth Token</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black text-sm font-mono bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Twilio Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+1XXXXXXXXXX"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black text-sm font-mono bg-slate-50/50"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingTwilio}
                  className="flex items-center justify-center py-2.5 px-5 bg-black hover:bg-[#1f2937] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingTwilio ? 'Saving...' : 'Save Twilio Credentials'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 5. TEST CALL TAB PANEL */}
        {activeTab === 'test' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-in max-w-md">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold font-outfit text-slate-900">Trigger Outbound Test Call</h3>
              <p className="text-xs text-slate-500">Test AI Agent voice, prompt parameters, and latency instantly</p>
            </div>

            {testCallStatus === 'idle' ? (
              <form onSubmit={handleTriggerTestCall} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +919516870988"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value.replace(/[^\d+]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black text-sm font-semibold bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDialing}
                  className="w-full flex items-center justify-center py-2.5 bg-black hover:bg-[#1f2937] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Phone className="h-4 w-4 mr-1.5" /> {isDialing ? 'Dialing...' : 'Dial Test Call'}
                </button>
              </form>
            ) : (
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/40 text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${testCallStatus === 'dialing' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    {testCallStatus === 'dialing' ? 'Dialing...' : 'Call Active Connected'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">{testNumber}</p>
                  <p className="text-xl font-mono font-extrabold text-slate-800">{getTimerDisplay()}</p>
                </div>

                <button
                  onClick={handleEndTestCall}
                  className="mx-auto flex items-center justify-center py-2 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <PhoneOff className="h-4 w-4 mr-1.5" /> End Test Call
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
