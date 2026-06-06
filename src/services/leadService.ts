import { storage } from './storage';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Demo Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company: string;
  industry?: string;
  budget?: number;
  source?: string;
  status: LeadStatus;
  notes: string;
  assignedToId?: string;
  createdAt: number;
  updatedAt: number;
}

const LEADS_KEY = 'madzassist_leads';

const DEMO_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Rahul Sharma',
    email: 'rahul@acmetech.in',
    phone: '+91 98765 43210',
    company: 'Acme Technologies Pvt Ltd',
    industry: 'Technology',
    budget: 850000,
    source: 'Website',
    status: 'Qualified',
    notes: 'Looking for a comprehensive CRM solution. Budget approved.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'lead-2',
    name: 'Priya Patel',
    email: 'priya@designco.in',
    phone: '+91 91234 56780',
    company: 'DesignCo Solutions',
    industry: 'Design Agency',
    budget: 225000,
    source: 'Referral',
    status: 'Contacted',
    notes: 'Needs basic customer support automation.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: 'lead-3',
    name: 'Amit Kumar',
    email: 'amit.k@globex.in',
    phone: '+91 99887 76655',
    company: 'Globex Enterprises',
    industry: 'Manufacturing',
    budget: 1800000,
    source: 'LinkedIn',
    status: 'Proposal Sent',
    notes: 'Interested in the Enterprise plan with custom integrations.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'lead-4',
    name: 'Neha Gupta',
    email: 'neha@technova.in',
    phone: '+91 98765 12345',
    company: 'TechNova Systems',
    industry: 'Software',
    budget: 1250000,
    source: 'Event',
    status: 'Demo Scheduled',
    notes: 'Wants to see how the AI handles complex technical queries.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: 'lead-5',
    name: 'Vikram Singh',
    email: 'vikram.s@futurescale.ai',
    phone: '+91 90000 11111',
    company: 'FutureScale AI Pvt Ltd',
    industry: 'AI Research',
    budget: 2500000,
    source: 'Cold Email',
    status: 'Negotiation',
    notes: 'Negotiating annual billing discount. Highly qualified.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  }
];

export const leadService = {
  getAll: (): Lead[] => {
    const data = storage.get(LEADS_KEY);
    if (!data || data.length === 0) {
      storage.set(LEADS_KEY, DEMO_LEADS);
      return DEMO_LEADS;
    }
    return data;
  },

  getByAssignee: (employeeId: string): Lead[] => {
    return leadService.getAll().filter(l => l.assignedToId === employeeId);
  },

  create: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Lead => {
    const leads = leadService.getAll();
    const newLead: Lead = {
      ...data,
      status: 'New',
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.set(LEADS_KEY, [...leads, newLead]);
    return newLead;
  },

  update: (id: string, updates: Partial<Lead>): Lead => {
    const leads = leadService.getAll();
    const index = leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error("Lead not found");
    
    leads[index] = { ...leads[index], ...updates, updatedAt: Date.now() };
    storage.set(LEADS_KEY, leads);
    return leads[index];
  },
  
  delete: (id: string): void => {
    const leads = leadService.getAll();
    storage.set(LEADS_KEY, leads.filter(l => l.id !== id));
  }
};
