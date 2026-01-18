
import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView: React.FC = () => {
  return (
    <div className="py-6 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Calendar</h2>
          <p className="text-xs text-slate-500 font-medium">Syncing with Google Calendar</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Simplified Weekly Strip */}
      <div className="flex justify-between mb-10">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
          <div key={day} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</span>
            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl text-xs font-bold transition-all ${
              i === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'text-slate-600 hover:bg-slate-100'
            }`}>
              {19 + i}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upcoming Today</h3>
        
        <div className="space-y-4">
          <MeetingCard 
            title="Q3 Strategy Sync" 
            time="10:00 AM - 11:00 AM" 
            attendees={['Sarah Chen', 'You']} 
            type="crm" 
          />
          <MeetingCard 
            title="Internal Product Sync" 
            time="1:30 PM - 2:00 PM" 
            attendees={['Engineering Team']} 
            type="internal" 
          />
          <MeetingCard 
            title="Final Pricing Negotiation" 
            time="4:00 PM - 5:00 PM" 
            attendees={['Elena Rodriguez', 'Legal']} 
            type="crm" 
          />
        </div>
      </div>
    </div>
  );
};

const MeetingCard: React.FC<{ title: string; time: string; attendees: string[]; type: 'crm' | 'internal' }> = ({ title, time, attendees, type }) => {
  return (
    <div className={`p-5 rounded-3xl border transition-all ${
      type === 'crm' 
        ? 'bg-white border-indigo-100 shadow-sm border-l-4 border-l-indigo-600' 
        : 'bg-slate-50 border-slate-100 text-slate-500'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {type === 'crm' && (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase rounded-lg">CRM Event</span>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-300" />
          <span>{time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-slate-300" />
          <span>{attendees.length} people</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {attendees.slice(0, 3).map((a, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
              {a[0]}
            </div>
          ))}
          {attendees.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
              +{attendees.length - 3}
            </div>
          )}
        </div>
        <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default CalendarView;
