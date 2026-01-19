
import React from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  ChevronRight,
  Zap,
  Calendar as CalendarIcon,
  Mail
} from 'lucide-react';
import { Contact, LeadStage, EmailThread } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  contacts: Contact[];
  setActiveTab: (tab: any) => void;
  emailThreads?: EmailThread[];
  ignoredEmails?: Set<string>;
}

const DashboardView: React.FC<Props> = ({ contacts, setActiveTab, emailThreads = [], ignoredEmails = new Set() }) => {
  const totalValue = contacts.reduce((acc, curr) => acc + curr.value, 0);
  const activeLeads = contacts.filter(c => c.stage !== LeadStage.WON && c.stage !== LeadStage.LOST).length;

  // Calculate Pending Inbound (Emails from known contacts, not ignored, not logged yet)
  // Note: We don't have access to loggedIds here easily unless passed down, 
  // but we can approximate or just show recent relevant ones. 
  // Ideally App should pass pending emails, but we can compute 'Suggested' here.
  // For simplicity, we'll show up to 3 'Suggested' emails.

  // Calculate Pending Inbound (Emails from known contacts, not ignored, not logged yet)
  // New Logic: 
  // 1. Triage Items (passed as emailThreads) - Unknown senders
  // 2. Recent Interactions from Contacts - Known senders (auto-associated)

  const recentContactEmails = contacts.flatMap(c => {
    // Get recent email interactions (e.g. last 3 days)
    return c.interactions
      .filter(i => i.type === 'email' && new Date(i.date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
      .map(i => ({
        id: i.id,
        from: c.name, // Use contact name
        email: c.email,
        subject: i.summary.replace('Received: ', ''),
        date: i.date,
        snippet: 'Auto-logged interaction',
        isKnown: true
      }));
  });

  // Triage items (Unknowns)
  const triageItems = emailThreads.map(t => ({ ...t, isKnown: false }));

  // Combine and sort by date desc
  const pendingInbound = [...recentContactEmails, ...triageItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Show top 5

  const stageData = [
    { name: 'Leads', value: contacts.filter(c => c.stage === LeadStage.LEAD).length, color: '#6366f1' },
    { name: 'Active', value: contacts.filter(c => c.stage !== LeadStage.LEAD && c.stage !== LeadStage.WON && c.stage !== LeadStage.LOST).length, color: '#8b5cf6' },
    { name: 'Won', value: contacts.filter(c => c.stage === LeadStage.WON).length, color: '#10b981' },
  ];

  return (
    <div className="px-6 py-6 space-y-6">

      {/* Pending Inbound / Smart Updates */}
      {pendingInbound.length > 0 && (
        <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100/50 text-indigo-700 rounded-xl">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Inbound Updates</h3>
                <p className="text-xs text-slate-500 font-medium">{pendingInbound.length} recent updates (Triage & Deals)</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('email')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Process Inbox
            </button>
          </div>

          <div className="space-y-3 relative z-10">
            {pendingInbound.map(thread => (
              <div key={thread.id} className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-2xl hover:bg-white border border-transparent hover:border-indigo-100 hover:shadow-sm transition-all group cursor-pointer" onClick={() => setActiveTab('email')}>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${thread.isKnown ? 'bg-white border-slate-200 text-indigo-700' : 'bg-indigo-600 border-transparent text-white'}`}>
                  {thread.isKnown ? thread.from.charAt(0) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{thread.from}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{thread.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium truncate mb-0.5">{thread.subject}</p>
                  <p className="text-[10px] text-slate-400 truncate">{thread.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 md:mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500">Pipeline</span>
          </div>
          <div className="text-xl font-bold text-slate-900">${(totalValue / 1000).toFixed(1)}k</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">+12.5% vs last month</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500">Close Rate</span>
          </div>
          <div className="text-xl font-bold text-slate-900">42%</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Goal: 50%</div>
        </div>
      </div>

      {/* AI Assistant Insight Card */}
      <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap size={80} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-indigo-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Solo Assistant</span>
        </div>
        <h3 className="text-lg font-bold leading-tight mb-2">Follow up with Elena Rodriguez today.</h3>
        <p className="text-sm text-indigo-100 opacity-90 mb-4 font-medium">
          The Q3 rollout proposal hasn't been touched in 4 days. Elena usually responds within 48 hours.
        </p>
        <button
          onClick={() => setActiveTab('contacts')}
          className="bg-white text-indigo-600 text-xs font-bold py-2.5 px-5 rounded-full hover:bg-indigo-50 transition-colors"
        >
          View Pipeline
        </button>
      </div>

      {/* Pipeline Chart */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline Distribution</h3>
        <div className="flex items-center">
          <div className="h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 ml-6 space-y-3">
            {stageData.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-medium text-slate-600">{stage.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{stage.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
          <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 uppercase tracking-wider">
            View All <ChevronRight size={12} />
          </button>
        </div>
        <div className="space-y-3">
          <ActivityItem
            title="Meeting with Sarah Chen"
            time="2h ago"
            type="meeting"
          />
          <ActivityItem
            title="Email received from Nexus Tech"
            time="5h ago"
            type="email"
          />
          <ActivityItem
            title="Lead Marcus Miller created"
            time="Yesterday"
            type="lead"
          />
        </div>
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{ title: string; time: string; type: string }> = ({ title, time, type }) => {
  // Fix: CalendarIcon and Mail were missing from imports
  const Icon = type === 'meeting' ? CalendarIcon : type === 'email' ? Mail : Users;
  return (
    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="p-2 bg-slate-50 text-slate-400 rounded-xl">
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={10} className="text-slate-300" />
          <span className="text-[10px] text-slate-400 font-medium">{time}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
