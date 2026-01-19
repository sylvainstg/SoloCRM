
export enum LeadStage {
  LEAD = 'Lead',
  QUALIFICATION = 'Qualification',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export type InteractionType = 'email' | 'call' | 'meeting' | 'note';

export interface Interaction {
  id: string;
  type: InteractionType;
  date: string;
  summary: string;
  details?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  direction?: 'inbound' | 'outbound';
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  stage: LeadStage;
  value: number;
  lastInteractionDate: string;
  interactions: Interaction[];
  aiInsight?: string;
  notes?: string;
  createdAt?: string;
  stageLastUpdated?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  participants: string[];
}

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  email?: string;
  date: string;
  snippet: string;
}
