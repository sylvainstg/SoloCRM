
import React, { useState } from 'react';
import { Mail, Search, RefreshCw, Zap, Star, Archive, ChevronRight, Lock } from 'lucide-react';

const EmailSyncView: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  if (!isConnected) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-10 text-center py-20">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connect your Inbox</h2>
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          SoloCRM needs access to your emails to track interactions and extract lead details automatically.
        </p>
        <button 
          onClick={() => setIsConnected(true)}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <Mail size={18} />
          Connect Gmail or Outlook
        </button>
        <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
          Secure OAuth 2.0 Connection
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Email Sync</h2>
          <p className="text-xs text-slate-500 font-medium">3 threads identified as CRM Leads</p>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-indigo-600 transition-all active:scale-90 ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={14} className="text-indigo-600" />
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Solo Smart Extract</span>
        </div>
        <p className="text-xs text-indigo-800 font-medium">
          Found a new contact: <span className="font-bold">Jordan @ CloudStream</span> asking about API docs. Create a Lead?
        </p>
        <div className="flex gap-2 mt-4">
          <button className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm">Add Lead</button>
          <button className="bg-white text-indigo-600 text-[10px] font-bold px-4 py-2 rounded-lg border border-indigo-100">Dismiss</button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Relevant Threads</h3>
        
        <div className="space-y-3">
          <EmailThreadItem 
            sender="Sarah Chen" 
            subject="Pricing Proposal - Next Steps" 
            snippet="Thanks for the demo earlier. We've reviewed the tier 2 pricing and have a few questions..."
            time="10:24 AM"
            isUnread={true}
          />
          <EmailThreadItem 
            sender="Marcus Miller" 
            subject="Re: Nice meeting you!" 
            snippet="Great to connect at the conference. Looking forward to hearing more about SoloCRM..."
            time="Yesterday"
            isUnread={false}
          />
          <EmailThreadItem 
            sender="Support @ AWS" 
            subject="Your account usage update" 
            snippet="This is an automated notification regarding your recent infrastructure scaling..."
            time="Yesterday"
            isUnread={false}
            isIrrelevant={true}
          />
        </div>
      </div>
    </div>
  );
};

const EmailThreadItem: React.FC<{ sender: string; subject: string; snippet: string; time: string; isUnread: boolean; isIrrelevant?: boolean }> = ({ sender, subject, snippet, time, isUnread, isIrrelevant }) => {
  return (
    <div className={`p-4 rounded-3xl border transition-all ${isIrrelevant ? 'opacity-50' : 'bg-white border-slate-100 shadow-sm'} ${isUnread ? 'ring-1 ring-indigo-100' : ''}`}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          {isUnread && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
          <span className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{sender}</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400">{time}</span>
      </div>
      <h4 className={`text-xs mb-1 truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{subject}</h4>
      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{snippet}</p>
      
      {!isIrrelevant && (
        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
          <div className="flex gap-4 text-slate-300">
            <Star size={14} className="hover:text-amber-400 transition-colors cursor-pointer" />
            <Archive size={14} className="hover:text-slate-600 transition-colors cursor-pointer" />
          </div>
          <button className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 uppercase tracking-wider">
            Match Lead <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailSyncView;
