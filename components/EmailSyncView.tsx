import React, { useEffect, useState, useMemo } from 'react';
import { Mail, RefreshCw, AlertCircle, Check, X, User as UserIcon, LogIn, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listEmails } from '../services/gmailService';
import { addInteraction, addContact, ignoreSender, subscribeToIgnored } from '../services/firestoreService';
import { EmailThread, Contact, LeadStage } from '../types';

interface Props {
  contacts: Contact[];
}

const EmailSyncView: React.FC<Props> = ({ contacts = [] }) => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggested' | 'all'>('suggested');

  // Persistent Ignored Senders
  const [ignoredEmails, setIgnoredEmails] = useState<Set<string>>(new Set());
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());

  const { googleAccessToken, signInWithGoogle, user } = useAuth();

  // Subscribe to Ignored List
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToIgnored(user.uid, (emails) => {
      setIgnoredEmails(new Set(emails));
    });
    return () => unsubscribe();
  }, [user]);

  const fetchEmails = async () => {
    if (!googleAccessToken) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch 50 to ensure we have enough after filtering
      const data = await listEmails(googleAccessToken, 50);
      setThreads(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load emails. You may need to grant permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleAccessToken) {
      fetchEmails();
    }
  }, [googleAccessToken]);

  // Triage Logic
  const triagedThreads = useMemo(() => {
    // Filter out ignored senders
    const visible = threads.filter(t => t.email && !ignoredEmails.has(t.email.toLowerCase()));

    const suggested = visible.filter(t => {
      return contacts.some(c => c.email.toLowerCase() === t.email?.toLowerCase());
    });

    const others = visible.filter(t => !suggested.includes(t));

    return { suggested, others };
  }, [threads, contacts, ignoredEmails]);

  const handleIgnore = async (thread: EmailThread, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !thread.email) return;

    // Optimistic update
    setIgnoredEmails(prev => new Set(prev).add(thread.email!.toLowerCase()));

    await ignoreSender(user.uid, thread.email.toLowerCase());
  };

  const handleLog = async (thread: EmailThread, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const contact = contacts.find(c => c.email.toLowerCase() === thread.email?.toLowerCase());

    if (contact) {
      // Log Interaction
      await addInteraction(user.uid, contact.id, {
        id: `email-${thread.id}`,
        type: 'email',
        date: new Date().toISOString().split('T')[0],
        summary: `Received email: ${thread.subject}`,
        sentiment: 'neutral'
      });
      setLoggedIds(prev => new Set(prev).add(thread.id));
    } else {
      // Create New Lead
      if (!thread.email) return;

      const newContact: Contact = {
        id: crypto.randomUUID(),
        name: thread.from,
        company: 'New Lead', // Placeholder
        email: thread.email,
        phone: '',
        stage: LeadStage.LEAD,
        value: 0,
        lastInteractionDate: new Date().toISOString().split('T')[0],
        interactions: [{
          id: `email-${thread.id}`,
          type: 'email',
          date: new Date().toISOString().split('T')[0],
          summary: `Initial contact: ${thread.subject}`,
          sentiment: 'neutral'
        }]
      };

      await addContact(user.uid, newContact);
      setLoggedIds(prev => new Set(prev).add(thread.id));
      alert(`Lead Created: ${thread.from}`);
    }
  };

  if (!googleAccessToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-indigo-50 p-4 rounded-full mb-4 text-indigo-600">
          <Mail size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connect to Gmail</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          We need your permission to access your emails. Please sign in to grant access.
        </p>
        <button
          onClick={signInWithGoogle}
          className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
        >
          Authorize Gmail Access
        </button>
      </div>
    );
  }

  const renderThreadList = (list: EmailThread[], emptyMsg: string) => {
    if (list.length === 0) return <div className="text-center text-slate-400 mt-10">{emptyMsg}</div>;

    return list.map(thread => {
      const isLogged = loggedIds.has(thread.id);
      const contact = contacts.find(c => c.email.toLowerCase() === thread.email?.toLowerCase());

      return (
        <div key={thread.id} className={`bg-white p-4 rounded-2xl border ${isLogged ? 'border-green-200 bg-green-50' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all cursor-pointer group relative`}>

          {/* Known Contact Badge */}
          {contact && (
            <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
              <UserIcon size={10} />
              {contact.name}
            </div>
          )}

          <div className="flex justify-between items-start mb-1 pr-8">
            <div className="flex flex-col">
              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{thread.from}</h3>
              <span className="text-[10px] text-slate-400">{thread.email}</span>
            </div>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{thread.date}</span>
          </div>
          <p className="text-xs font-semibold text-slate-700 mb-1 truncate">{thread.subject}</p>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {thread.snippet}
          </p>

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t border-slate-50 pt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleIgnore(thread, e)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
              title="Ignore Sender"
            >
              <X size={14} />
              <span className="text-xs font-medium">Ignore</span>
            </button>

            <button
              onClick={(e) => handleLog(thread, e)}
              disabled={isLogged}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${isLogged
                  ? 'text-green-600 bg-green-100 cursor-default'
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                }`}
              title={contact ? "Log Interaction" : "Create Lead"}
            >
              {isLogged ? <Check size={14} /> : contact ? <LogIn size={14} /> : <Plus size={14} />}
              <span className="text-xs font-bold">{isLogged ? 'Saved' : contact ? 'Log' : 'Add Lead'}</span>
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="py-6 px-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Inbox Triage</h2>
          <p className="text-xs text-slate-500 font-medium">syncing... (INBOX)</p>
        </div>
        <button
          onClick={fetchEmails}
          disabled={loading}
          className={`p-2 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-4 w-full max-w-sm">
        <button
          onClick={() => setActiveTab('suggested')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'suggested'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Suggested ({triagedThreads.suggested.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'all'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Others ({triagedThreads.others.length})
        </button>
      </div>

      {loading && threads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="ml-2 text-xs">Fetching emails...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20">
          {activeTab === 'suggested'
            ? renderThreadList(triagedThreads.suggested, "No suggested matches found.")
            : renderThreadList(triagedThreads.others, "All inbox emails caught up!")
          }
        </div>
      )}
    </div>
  );
};

export default EmailSyncView;
