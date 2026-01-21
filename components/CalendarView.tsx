
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, ArrowRight, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listEvents, CalendarEvent } from '../services/calendarService';

const CalendarView: React.FC = () => {
  const { googleAccessToken, user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!googleAccessToken) return;

      setLoading(true);
      setError(null);
      try {
        // Fetch for the selected day (Start of day to End of day)
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const data = await listEvents(
          googleAccessToken,
          startOfDay.toISOString(),
          endOfDay.toISOString()
        );
        setEvents(data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load calendar events.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [googleAccessToken, selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Helper to identify "CRM" vs "Internal" (Simple logic: external attendees = CRM)
  const getEventType = (event: CalendarEvent): 'crm' | 'internal' => {
    if (!event.attendees) return 'internal';
    // Assume if any attendee is not the current user (and likely external domain), it's CRM
    // For simplicity, just check existence of other attendees
    return event.attendees.length > 1 ? 'crm' : 'internal';
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return 'All Day';
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Generate weekly strip dates based on selectedDate
  const getWeekDays = () => {
    const current = new Date(selectedDate);
    // Start from Monday (or Sunday depending on preference, sticking to UI's partial view logic)
    // Let's just show -3 to +3 days around selected
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(current);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  if (!user) return <div className="p-6">Please sign in to view your calendar.</div>;

  return (
    <div className="py-6 px-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Calendar</h2>
          <p className="text-xs text-slate-500 font-medium">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
          <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs font-bold text-slate-600 px-2 py-1 hover:bg-slate-50 rounded-lg">
            Today
          </button>
          <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable Weekly Strip */}
      <div className="flex justify-between mb-10 overflow-x-auto no-scrollbar shrink-0 gap-4">
        {getWeekDays().map((date, i) => {
          const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth();
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(date)}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className={`w-10 h-10 flex items-center justify-center rounded-2xl text-xs font-bold transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'text-slate-600 bg-white border border-slate-100 group-hover:bg-slate-50'
                }`}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-50/95 py-2 backdrop-blur-sm z-10 flex justify-between">
          <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          {loading && <Loader2 className="animate-spin text-indigo-600" size={14} />}
        </h3>

        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-indigo-600 mr-2" size={24} />
            <span className="text-sm font-medium text-slate-500">Syncing with Google...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium text-center">
            {error}
            <button onClick={() => window.location.reload()} className="block mx-auto mt-2 underline">Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm font-medium">No events scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {events.map(event => (
              <MeetingCard
                key={event.id}
                title={event.summary || '(No Title)'}
                time={formatDateRange(event.start.dateTime || event.start.date, event.end.dateTime || event.end.date)}
                attendees={event.attendees?.map(a => a.displayName || a.email) || []}
                type={getEventType(event)}
                link={event.htmlLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingCard: React.FC<{ title: string; time: string; attendees: string[]; type: 'crm' | 'internal'; link?: string }> = ({ title, time, attendees, type, link }) => {
  return (
    <a href={link} target="_blank" rel="noreferrer" className={`block p-5 rounded-3xl border transition-all hover:shadow-md ${type === 'crm'
        ? 'bg-white border-indigo-100 shadow-sm border-l-4 border-l-indigo-600'
        : 'bg-white border-slate-100 text-slate-500 border-l-4 border-l-slate-300'
      }`}>
      <div className="flex justify-between items-start mb-3">
        <h4 className={`text-sm font-bold ${type === 'crm' ? 'text-slate-900' : 'text-slate-700'}`}>{title}</h4>
        {type === 'crm' && (
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase rounded-lg">External</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-300" />
          <span>{time}</span>
        </div>
        {attendees.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-300" />
            <span>{attendees.length} people</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {attendees.slice(0, 3).map((a, i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase" title={a}>
              {a[0]}
            </div>
          ))}
          {attendees.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
              +{attendees.length - 3}
            </div>
          )}
        </div>
        <div className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
          <ArrowRight size={18} />
        </div>
      </div>
    </a>
  );
};

export default CalendarView;
