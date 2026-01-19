import React, { useEffect, useState, useMemo } from 'react';
import { Mail, RefreshCw, AlertCircle, Check, X, User as UserIcon, LogIn, Plus, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addInteraction, addContact, ignoreSender, deleteTriageItem, createContactFromTriage } from '../services/firestoreService';
import { EmailThread, Contact, LeadStage } from '../types';
import LeadCaptureModal from './LeadCaptureModal';

interface Props {
  contacts: Contact[];
  threads: EmailThread[];
  loading: boolean;
  error: string | null; // Added error prop as it was previously internal state
  onRefresh: () => void;
  ignoredEmails: Set<string>;
  googleAccessToken: string | null; // Added googleAccessToken prop
  signInWithGoogle: () => void; // Added signInWithGoogle prop
  onLoadMore?: () => void; // Optional for now to prevent breaking immediate build
  hasMore?: boolean;
  isAuthError?: boolean;
  signInWithGoogle?: () => void;
}

const EmailSyncView: React.FC<Props> = ({
  contacts = [],
  threads = [],
  loading = false,
  error = null,
  onRefresh,
  ignoredEmails,
  googleAccessToken,
  signInWithGoogle = () => { },
  onLoadMore,
  hasMore = false,
  isAuthError = false,
}) => {
  // Local state for toggles/UI only
  const [activeTab, setActiveTab] = useState<'suggested' | 'all'>('suggested');
  const [selectedThreadForCreation, setSelectedThreadForCreation] = useState<EmailThread | null>(null);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [tempIgnored, setTempIgnored] = useState<Set<string>>(new Set());
  const [tempLogged, setTempLogged] = useState<Map<string, string>>(new Map());

  const { user } = useAuth();
  // Removed internal fetchEmails, using onRefresh prop instead
  // Removed internal ignoredEmails state, using prop instead

  console.log("EmailSyncView Render Cycle. Modal State:", !!selectedThreadForCreation);

  // The subscription to ignored senders should ideally be in the parent component
  // that manages the `ignoredEmails` prop. For now, keeping it here but it will
  // update the prop directly if the parent passes a setter, or the parent needs
  // to re-fetch/re-subscribe. Given the refactor, this useEffect should likely
  // be moved to the parent component that provides `ignoredEmails`.
  // For this specific refactor, I'll remove it as `ignoredEmails` is now a prop.
  // If the parent needs to manage this, it will handle the subscription.

  // Triage Logic
  const triagedThreads = useMemo(() => {
    // Filter out ignored senders (both prop and local temp) AND logged threads
    const visible = threads.filter(t => {
      if (!t.email) return false;
      const email = t.email.toLowerCase();
      if (ignoredEmails.has(email) || tempIgnored.has(email)) return false;

      // Check if logged with SAME snippet (if snippet changed, show it again!)
      const loggedSnippet = tempLogged.get(t.id);
      if (loggedIds.has(t.id) || (loggedSnippet && loggedSnippet === t.snippet)) return false;

      return true;
    });

    const suggested = visible.filter(t => {
      return contacts.some(c => c.email.toLowerCase() === t.email?.toLowerCase());
    });

    const others = visible.filter(t => !suggested.includes(t));

    return { suggested, others };
  }, [threads, contacts, ignoredEmails, loggedIds, tempIgnored, tempLogged]);

  const handleIgnore = async (thread: EmailThread, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !thread.email) return;

    // Optimistic update
    setTempIgnored(prev => new Set(prev).add(thread.email!.toLowerCase()));

    await ignoreSender(user.uid, thread.email.toLowerCase());
    await deleteTriageItem(user.uid, thread.id);
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
    });

    console.log(`Manually logged thread ${thread.id}`);
    setLoggedIds(prev => new Set(prev).add(thread.id));
    setTempLogged(prev => new Map(prev).set(thread.id, thread.snippet));

    // Remove from Triage Queue
    await deleteTriageItem(user.uid, thread.id);
  } else {
    // Open Modal for New Lead
    if (!thread.email) {
    // Fallback if no email, but still allow creation
    console.warn("Thread missing email, allowing manual entry");
  }
  setSelectedThreadForCreation(thread);
}
  };

const handleSaveOpportunity = async (data: { name: string; company: string; email: string; value: number; closeDate: string; notes: string }) => {
  if (!user || !selectedThreadForCreation) return;

  const newContact: Contact = {
    id: crypto.randomUUID(),
    name: data.name,
    company: data.company,
    email: data.email,
    phone: '',
    stage: LeadStage.LEAD,
    value: data.value,
    lastInteractionDate: new Date().toISOString().split('T')[0],
    notes: data.notes,
    interactions: [{
      id: `email-${selectedThreadForCreation.id}`,
      type: 'email',
      date: new Date().toISOString().split('T')[0],
      summary: `Initial contact: ${selectedThreadForCreation.subject}`,
      sentiment: 'neutral'
    }]
  };

  // Use atomic helper to create contact + delete triage item
  await createContactFromTriage(user.uid, newContact, selectedThreadForCreation.id);

  setLoggedIds(prev => new Set(prev).add(selectedThreadForCreation.id));
  setTempLogged(prev => new Map(prev).set(selectedThreadForCreation.id, selectedThreadForCreation.snippet)); // Hide THIS version
  setSelectedThreadForCreation(null); // Close modal
  alert(`Opportunity Created: ${data.name}`);
};

// Removed local auth check since App handles authentication, but valid to keep for type safety/UX
// If we assume App only renders this when auth is ready, we can simplify.
// But let's keep a simplified empty state if no threads.

// Auto-switch to 'all' (Others) if no suggested emails but we have others
useEffect(() => {
  // Only switch if we are in 'suggested' and it's empty, and we have 'others'
  if (activeTab === 'suggested' && triagedThreads.suggested.length === 0 && triagedThreads.others.length > 0) {
    setActiveTab('all');
  }
}, [triagedThreads.suggested.length, triagedThreads.others.length, activeTab]);

const renderThreadList = (list: EmailThread[], emptyMsg: string) => {
  if (list.length === 0) return <div className="text-center text-slate-400 mt-10">{emptyMsg}</div>;

  return list.map(thread => {
    const isLogged = loggedIds.has(thread.id);
    const contact = contacts.find(c => c.email.toLowerCase() === thread.email?.toLowerCase());

    return (
      <div key={thread.id} className={`bg-white p-4 rounded-2xl border ${isLogged ? 'border-green-200 bg-green-50' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all cursor-pointer group relative`}>

        {/* Known Contact Badge */}
        {contact && (
          <div className="absolute top-3 right-3 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
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

        {/* Actions - Always Visible */}
        <div className="flex gap-2 justify-end border-t border-slate-50 pt-2">
          <button
            onClick={(e) => handleIgnore(thread, e)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            title="Block Sender"
          >
            <Ban size={14} />
            <span className="text-xs font-medium">Block</span>
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
        onClick={onRefresh}
        disabled={loading}
        className={`p-2 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 hover:text-indigo-600 transition-all ${loading ? 'animate-spin' : ''}`}
      >
        <RefreshCw size={20} />
      </button>
    </div>

    {/* Auth Error State */}
    {isAuthError && (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <div className="text-xs font-bold">Connection Expired</div>
        </div>
        <button
          onClick={signInWithGoogle}
          className="text-xs font-bold bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          Reconnect Gmail
        </button>
      </div>
    )}

    {/* Tabs */}
    <div className="flex p-1 bg-slate-100 rounded-xl mb-4 w-full max-w-sm relative">
      <button
        onClick={() => setActiveTab('suggested')}
        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${activeTab === 'suggested'
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        Suggested ({triagedThreads.suggested.length})
      </button>
      <button
        onClick={() => setActiveTab('all')}
        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${activeTab === 'all'
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
          }`}
      >
        Others ({triagedThreads.others.length})
        {triagedThreads.others.length > 0 && activeTab !== 'all' && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
        )}
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

        {hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-3 mt-4 mb-8 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div> : <Plus size={16} />}
            Load More Emails
          </button>
        )}
      </div>
    )}

    {selectedThreadForCreation && (
      <LeadCaptureModal
        thread={selectedThreadForCreation}
        onClose={() => setSelectedThreadForCreation(null)}
        onSave={handleSaveOpportunity}
      />
    )}
  </div>
);
};

export default EmailSyncView;
