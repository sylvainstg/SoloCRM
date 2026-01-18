
import React from 'react';
import { 
  Users, 
  BarChart3, 
  Calendar, 
  Mail, 
  Settings, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  UserPlus
} from 'lucide-react';

export const STAGES_ORDER = [
  'Lead',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost'
];

export const STAGE_COLORS: Record<string, string> = {
  'Lead': 'bg-blue-100 text-blue-700 border-blue-200',
  'Qualification': 'bg-purple-100 text-purple-700 border-purple-200',
  'Proposal': 'bg-amber-100 text-amber-700 border-amber-200',
  'Negotiation': 'bg-orange-100 text-orange-700 border-orange-200',
  'Won': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Lost': 'bg-rose-100 text-rose-700 border-rose-200'
};
