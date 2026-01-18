
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
import { Contact, LeadStage } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  contacts: Contact[];
  setActiveTab: (tab: any) => void;
}

const DashboardView: React.FC<Props> = ({ contacts, setActiveTab }) => {
  const totalValue = contacts.reduce((acc, curr) => acc + curr.value, 0);
  const activeLeads = contacts.filter(c => c.stage !== LeadStage.WON && c.stage !== LeadStage.LOST).length;

  const stageData = [
    { name: 'Leads', value: contacts.filter(c => c.stage === LeadStage.LEAD).length, color: '#6366f1' },
    { name: 'Active', value: contacts.filter(c => c.stage !== LeadStage.LEAD && c.stage !== LeadStage.WON && c.stage !== LeadStage.LOST).length, color: '#8b5cf6' },
    { name: 'Won', value: contacts.filter(c => c.stage === LeadStage.WON).length, color: '#10b981' },
  ];

  return (
    <div className="px-6 py-6 space-y-6">
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
