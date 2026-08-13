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
  country?: 'India' | 'United Kingdom';
  companyEmail?: string;
  companyPhone?: string;
  companyNumber?: string;
  registeredAddress?: string;
  ownerName?: string;
  verificationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  verificationDocUrl?: string;
  rejectionReason?: string;
  allowedModules?: string[];
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
  initStoreFromStorage: () => void;
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

const getInitialStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedTenant = localStorage.getItem('tenant');

      let parsedUser = null;
      let parsedTenant = null;

      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        parsedUser = JSON.parse(storedUser);
      }
      if (storedTenant && storedTenant !== 'undefined' && storedTenant !== 'null') {
        parsedTenant = JSON.parse(storedTenant);
      }

      return {
        token: (storedToken && storedToken !== 'undefined' && storedToken !== 'null') ? storedToken : null,
        user: parsedUser,
        tenant: parsedTenant,
      };
    } catch (e) {
      console.error('Failed to parse initial state from localStorage:', e);
    }
  }
  return { token: null, user: null, tenant: null };
};

const initialStorage = getInitialStorage();

export const useStore = create<AppState>((set) => ({
  token: initialStorage.token,
  user: initialStorage.user,
  tenant: initialStorage.tenant,
  leads: [],
  campaigns: [
    { id: 'c1', name: 'Q3 Health Renewal', status: 'RUNNING', description: 'Policy renewal outreach', leadsCount: 240, completedCalls: 148, concurrencyLimit: 2, callsCount: 482, convertedCount: 38 },
    { id: 'c2', name: 'Senior Citizen Rider', status: 'COMPLETED', description: 'Qualify warm leads', leadsCount: 180, completedCalls: 180, concurrencyLimit: 3, callsCount: 612, convertedCount: 51 },
    { id: 'c3', name: 'Motor Insurance Lead Dial', status: 'PAUSED', description: 'Outbound campaign', leadsCount: 80, completedCalls: 0, concurrencyLimit: 2, callsCount: 0, convertedCount: 0 },
  ],
  callLogs: [
    {
      id: 'l1',
      leadName: 'Rahul Sharma',
      phoneNumber: '+91 98124 56789',
      status: 'Connected',
      duration: 134,
      summary: 'Inquired about senior citizen rider waiting period. Locked 10% renewal bonus.',
      transcript: [
        { speaker: 'AI', text: 'Hello Mr. Sharma, this is Priya calling from Star Health Insurance.' },
        { speaker: 'User', text: 'Hi, what is the renewal offer?' },
        { speaker: 'AI', text: 'Your Family Health Optima policy renewal bonus is active with a 10% discount.' }
      ]
    }
  ],
  wallet: { balance: 240.50 },
  activeCampaignId: null,
  currentTab: 'overview',

  initStoreFromStorage: () => {
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const storedTenant = localStorage.getItem('tenant');

        let parsedUser = null;
        let parsedTenant = null;

        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          parsedUser = JSON.parse(storedUser);
        }
        if (storedTenant && storedTenant !== 'undefined' && storedTenant !== 'null') {
          parsedTenant = JSON.parse(storedTenant);
        }

        set({
          token: storedToken,
          user: parsedUser,
          tenant: parsedTenant
        });
      } catch (err) {
        console.error('Safely caught storage parse error:', err);
      }
    }
  },

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
  setTenant: (tenantUpdates: any) => set((state) => {
    const normUpdates = {
      ...tenantUpdates,
      verificationStatus: tenantUpdates.verificationStatus || tenantUpdates.verification_status || state.tenant?.verificationStatus,
      companyName: tenantUpdates.companyName || tenantUpdates.company_name || state.tenant?.companyName,
      companyPhone: tenantUpdates.companyPhone || tenantUpdates.company_phone || state.tenant?.companyPhone,
      companyEmail: tenantUpdates.companyEmail || tenantUpdates.company_email || state.tenant?.companyEmail,
      registeredAddress: tenantUpdates.registeredAddress || tenantUpdates.registered_address || state.tenant?.registeredAddress,
      companyNumber: tenantUpdates.companyNumber || tenantUpdates.company_number || state.tenant?.companyNumber,
      ownerName: tenantUpdates.ownerName || tenantUpdates.owner_name || state.tenant?.ownerName,
      rejectionReason: tenantUpdates.rejectionReason !== undefined ? tenantUpdates.rejectionReason : (tenantUpdates.rejection_reason !== undefined ? tenantUpdates.rejection_reason : state.tenant?.rejectionReason),
    };
    const updatedTenant = state.tenant ? { ...state.tenant, ...normUpdates } as Tenant : {
      id: 'tenant-1',
      companyName: 'Star Health Insurance',
      website: 'https://starhealth.in',
      timezone: 'Asia/Kolkata',
      voiceId: 'sarvam_hindi_female_1',
      systemPrompt: 'You are Priya, a helpful insurance coordinator answering inquiries.',
      systemPromptVersion: 1,
      isAiReady: true,
      ...normUpdates
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
