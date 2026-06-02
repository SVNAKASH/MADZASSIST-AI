import { storage } from './storage';

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category?: string;
  status: TicketStatus;
  priority: TicketPriority;
  ownerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  conversationId?: string;
  assignedToId?: string;
  resolutionNotes?: string;
  createdAt: number;
  updatedAt: number;
}

const TICKETS_KEY = 'madzassist_tickets';

export const ticketService = {
  getAll: (): Ticket[] => storage.get(TICKETS_KEY) || [],

  getByOwner: (ownerId: string): Ticket[] => {
    return ticketService.getAll().filter(t => t.ownerId === ownerId);
  },

  getByAssignee: (assigneeId: string): Ticket[] => {
    return ticketService.getAll().filter(t => t.assignedToId === assigneeId);
  },

  create: (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Ticket => {
    const tickets = ticketService.getAll();
    const currentMax = tickets.filter(t => t.id.startsWith('TKT-'))
                              .map(t => parseInt(t.id.split('-')[1]) || 1000)
                              .reduce((a, b) => Math.max(a, b), 1000);
    const newTicket: Ticket = {
      ...data,
      status: 'Open',
      id: `TKT-${currentMax + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.set(TICKETS_KEY, [...tickets, newTicket]);
    return newTicket;
  },

  update: (id: string, updates: Partial<Ticket>): Ticket => {
    const tickets = ticketService.getAll();
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Ticket not found");
    
    tickets[index] = { ...tickets[index], ...updates, updatedAt: Date.now() };
    storage.set(TICKETS_KEY, tickets);
    return tickets[index];
  }
};
