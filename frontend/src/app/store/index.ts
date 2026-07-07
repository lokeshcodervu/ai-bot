import { create } from 'zustand';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Imported' | 'Pending Queue' | 'Connected' | 'Converted' | 'Needs Follow-up' | 'Not Interested';
  notes?: string;
  call_disposition?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'PAUSED' | 'RUNNING' | 'COMPLETED';
  leadsCount: number;
  completedCalls: number;
  concurrencyLimit: number;
  description?: string;
  callsCount?: number;
  convertedCount?: number;
}

export interface Tenant {
  id: string;
  companyName: string;
  website: string;
  timezone: string;
  voiceId: string;
  systemPrompt: string;
  systemPromptVersion: number;
  isAiReady: boolean;
  isPaymentDone?: boolean;
  settings?: any;
}

export interface CallLog {
  id: string;
  leadName: string;
  phoneNumber: string;
  status: string;
  duration: number;
  summary?: string;
  transcript?: { speaker: string; text: string }[];
}

interface AppState {
  token: string | null;
  user: { username: string; email: string; role: string; full_name?: string } | null;
  tenant: Tenant | null;
  leads: Lead[];
  campaigns: Campaign[];
  callLogs: CallLog[];
  wallet: { balance: number } | null;
  activeCampaignId: string | null;
  currentTab: string;
  setToken: (token: string | null) => void;
  setUser: (user: any) => void;
  setTenant: (tenant: Partial<Tenant>) => void;
  setLeads: (leads: Lead[]) => void;
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  addCallLog: (log: CallLog) => void;
  setWallet: (wallet: { balance: number }) => void;
  setCurrentTab: (tab: string) => void;
  setActiveCampaignId: (id: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  tenant: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tenant') || 'null') : null,
  leads: [],
  campaigns: [
    { id: 'c1', name: 'Q3 React Bootcamp', status: 'RUNNING', description: 'Book demos for Sep cohort', leadsCount: 240, completedCalls: 148, concurrencyLimit: 2, callsCount: 482, convertedCount: 38 },
    { id: 'c2', name: 'Python Admission', status: 'COMPLETED', description: 'Qualify warm leads', leadsCount: 180, completedCalls: 180, concurrencyLimit: 3, callsCount: 612, convertedCount: 51 },
    { id: 'c3', name: 'Data Science Outreach', status: 'PAUSED', description: 'Cold outreach', leadsCount: 80, completedCalls: 0, concurrencyLimit: 2, callsCount: 0, convertedCount: 0 },
    { id: 'c4', name: 'Mern Stack Cohort', status: 'RUNNING', description: 'Drive enrolments', leadsCount: 320, completedCalls: 48, concurrencyLimit: 2, callsCount: 156, convertedCount: 12 },
    { id: 'c5', name: 'UI/UX Masterclass', status: 'RUNNING', description: 'Webinar signups', leadsCount: 145, completedCalls: 87, concurrencyLimit: 2, callsCount: 388, convertedCount: 27 },
  ],
  callLogs: [
    {
      id: 'l1',
      leadName: 'John Doe',
      phoneNumber: '+1234567890',
      status: 'Connected',
      duration: 45,
      summary: 'Asked about cohort timings and batch options. Prefers weekend slots.',
      transcript: [
        { speaker: 'AI', text: 'Hello! I am Rohan from SecureLife. How can I help you today?' },
        { speaker: 'User', text: 'Hi, I saw your React Bootcamp post. What is the fee?' },
        { speaker: 'AI', text: 'The fees for our cohort plans are structured transparently. Let me load the course syllabus details for you.' }
      ]
    }
  ],
  wallet: { balance: 145.50 },
  activeCampaignId: null,
  currentTab: 'overview',
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    }
    set({ user });
  },
  setTenant: (tenantUpdates) => set((state) => {
    const updatedTenant = state.tenant ? { ...state.tenant, ...tenantUpdates } as Tenant : {
      id: 'tenant-1',
      companyName: 'SecureLife Inc',
      website: 'https://securelife.com',
      timezone: 'Asia/Kolkata',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      systemPrompt: 'You are Rohan, a helpful insurance coordinator answering inquiries.',
      systemPromptVersion: 1,
      isAiReady: true,
      ...tenantUpdates
    } as Tenant;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tenant', JSON.stringify(updatedTenant));
    }
    return { tenant: updatedTenant };
  }),
  setLeads: (leads) => set({ leads }),
  updateLeadStatus: (leadId, status) => set((state) => ({
    leads: state.leads.map((l) => (l.id === leadId ? { ...l, status } : l))
  })),
  addCampaign: (campaign) => set((state) => ({ campaigns: [...state.campaigns, campaign] })),
  updateCampaign: (campaignId, updates) => set((state) => ({
    campaigns: state.campaigns.map((c) => (c.id === campaignId ? { ...c, ...updates } : c))
  })),
  addCallLog: (log) => set((state) => ({ callLogs: [log, ...state.callLogs] })),
  setWallet: (wallet) => set({ wallet }),
  setCurrentTab: (currentTab) => set({ currentTab }),
  setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId }),
}));
