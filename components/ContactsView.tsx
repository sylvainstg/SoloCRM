
import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Building2,
  Mail,
  Phone,
  ArrowRight,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Send,
  Filter,
  Info
} from 'lucide-react';
import { Contact, LeadStage, EmailThread } from '../types';
import { STAGE_COLORS, STAGES_ORDER } from '../constants';
import { useAuth } from '../context/AuthContext';

interface Props {
  contacts: Contact[];
  emailThreads?: EmailThread[];
  updateContactStage: (id: string, newStage: LeadStage) => void;
  onUpdateContact: (id: string, data: Partial<Contact>) => void;
  onAddContact: () => void;
  // New props for lifted state
  filterType: 'all' | 'unread' | 'stuck' | 'alpha' | 'age';
  onFilterChange: (type: 'all' | 'unread' | 'stuck' | 'alpha' | 'age') => void;
}

import KanbanBoard from './KanbanBoard';

const ContactsView: React.FC<Props> = ({
  contacts,
  emailThreads = [],
  updateContactStage,
  onUpdateContact,
  onAddContact,
  filterType,
  onFilterChange
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Filter logic removed (handled by parent App.tsx) - using passed contacts directly
  const displayedContacts = contacts;

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!isDesktop && (
        <div className="px-6 py-4 mb-2">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Pipeline</h2>
              <p className="text-xs text-slate-500 font-medium">Swipe cards to progress deal stages</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'all', label: 'All', tooltip: 'Show all deals' },
              { id: 'unread', label: 'Unread', tooltip: 'Contacts with new emails in Inbox' },
              { id: 'stuck', label: 'Stuck', tooltip: 'No interaction in 14+ days' },
              { id: 'alpha', label: 'A-Z', tooltip: 'Sort alphabetically' },
              { id: 'age', label: 'Age', tooltip: 'Sort by staleness (Oldest first)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => onFilterChange(f.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${filterType === f.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                title={f.tooltip}
              >
                {filterType === f.id && <CheckCircle2 size={12} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {isDesktop ? (
          <div className="h-full p-4 overflow-x-auto relative">
            <KanbanBoard
              contacts={displayedContacts}
              onStageChange={updateContactStage}
              onContactClick={setSelectedContact}
              onUpdateContact={onUpdateContact}
              onAddContact={onAddContact}
            />
          </div>
        ) : (
          <div className="px-6 pb-10 overflow-y-auto h-full space-y-4 no-scrollbar">
            <AnimatePresence>
              {displayedContacts.map((contact) => (
                <ContactSwipeCard
                  key={contact.id}
                  contact={contact}
                  hasUnread={emailThreads.some(t => t.email?.toLowerCase() === contact.email.toLowerCase())}
                  onStageChange={(newStage) => updateContactStage(contact.id, newStage)}
                  onClick={() => setSelectedContact(contact)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </div>
  );
};

const ContactSwipeCard: React.FC<{
  contact: Contact;
  hasUnread?: boolean;
  onStageChange: (stage: LeadStage) => void;
  onClick: () => void;
}> = ({ contact, hasUnread, onStageChange, onClick }) => {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["#fef2f2", "#ffffff", "#f0fdf4"]
  );
  const opacityProgress = useTransform(x, [-100, 0, 100], [1, 0, 1]);
  const scaleProgress = useTransform(x, [-100, 0, 100], [1.2, 0.5, 1.2]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      // Advance stage
      const currentIndex = STAGES_ORDER.indexOf(contact.stage);
      if (currentIndex < STAGES_ORDER.length - 1) {
        onStageChange(STAGES_ORDER[currentIndex + 1] as LeadStage);
      }
    } else if (info.offset.x < -100) {
      // Regress/Lose stage
      if (contact.stage !== LeadStage.LOST) {
        onStageChange(LeadStage.LOST);
      }
    }
  };

  return (
    <div className="relative group">
      {/* Swipe Feedback Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <motion.div style={{ opacity: opacityProgress, scale: scaleProgress }} className="text-rose-500 flex items-center gap-2">
          <XCircle size={24} />
          <span className="text-xs font-bold uppercase">Lose</span>
        </motion.div>
        <motion.div style={{ opacity: opacityProgress, scale: scaleProgress }} className="text-emerald-500 flex items-center gap-2">
          <span className="text-xs font-bold uppercase">Advance</span>
          <CheckCircle2 size={24} />
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        onDragEnd={handleDragEnd}
        style={{ x, background }}
        onClick={onClick}
        className="relative z-10 p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:cursor-grabbing"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold relative">
              {contact.name.split(' ').map(n => n[0]).join('')}
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{contact.name}</h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{contact.company}</p>
            </div>
          </div>
          <button className="text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${STAGE_COLORS[contact.stage]}`}>
            {contact.stage}
          </span>
          <span className="text-xs font-bold text-slate-900">
            ${(contact.value / 1000).toFixed(1)}k
          </span>
        </div>

        {contact.aiInsight && (
          <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-2xl border border-indigo-100/50 mb-3">
            <Zap size={14} className="text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
              {contact.aiInsight}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-3">
            <Mail size={14} />
            <Phone size={14} />
          </div>
          <div className="flex items-center gap-1">
            {/* Fix: Clock was missing from imports */}
            <Clock size={12} />
            <span className="text-[10px] font-medium">{contact.lastInteractionDate}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ContactDetailModal: React.FC<{ contact: Contact; onClose: () => void }> = ({ contact, onClose }) => {
  const [replyingTo, setReplyingTo] = useState<{ id: string; summary: string; body?: string } | null>(null);
  const { googleAccessToken } = useAuth(); // Import useAuth
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Fetch full body when replyingTo changes, if not already fetched
  React.useEffect(() => {
    const fetchBody = async () => {
      if (replyingTo && !replyingTo.body && googleAccessToken) {
        setIsLoadingBody(true);
        try {
          const threadId = replyingTo.id.replace('email-', '');
          const { getThreadDetails } = await import('../services/gmailService');
          const details = await getThreadDetails(googleAccessToken, threadId);
          setReplyingTo(prev => prev ? { ...prev, body: details.lastMessageBody } : null);
        } catch (e) {
          console.error("Failed to fetch email body", e);
        } finally {
          setIsLoadingBody(false);
        }
      }
    };
    fetchBody();
  }, [replyingTo?.id, googleAccessToken]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo || !googleAccessToken) return;

    try {
      setIsSending(true);
      const threadId = replyingTo.id.replace('email-', '');
      const { sendReply } = await import('../services/gmailService');

      await sendReply(googleAccessToken, threadId, contact.email, replyingTo.summary.replace('Received email: ', ''), replyBody);

      alert("Reply sent!");
      setReplyingTo(null);
      setReplyBody('');
    } catch (err) {
      console.error(err);
      alert("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleAccessToken) return;

    try {
      setIsSending(true);
      const { sendEmail } = await import('../services/gmailService');

      await sendEmail(googleAccessToken, contact.email, composeSubject, composeBody);

      alert("Email sent!");
      setIsComposing(false);
      setComposeSubject('');
      setComposeBody('');
    } catch (err) {
      console.error(err);
      alert("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900">
          <ArrowRight className="rotate-180" size={24} />
        </button>
        <h3 className="text-lg font-bold text-slate-900">Contact Profile</h3>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-10">
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-3xl font-bold mb-4 shadow-sm">
            {contact.name.split(' ').map(n => n[0]).join('')}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{contact.name}</h2>
          <p className="text-sm font-medium text-slate-500 mb-2">{contact.company}</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STAGE_COLORS[contact.stage]}`}>
              {contact.stage}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <a href={`mailto:${contact.email}`} className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition-colors">
            <Mail size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Email</span>
          </a>
          <a href={`tel:${contact.phone}`} className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-100 transition-colors">
            <Phone size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Call</span>
          </a>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Interaction Timeline</h4>
          <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
            {contact.interactions.map((interaction, idx) => (
              <div key={idx} className="flex gap-4 relative">
                <div className={`w-5 h-5 rounded-full z-10 mt-1 flex items-center justify-center text-[10px] font-bold ${interaction.type === 'meeting' ? 'bg-indigo-600 text-white' :
                  interaction.type === 'email' ? 'bg-amber-400 text-white' :
                    'bg-slate-300 text-white'
                  }`}>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 capitalize">{interaction.type}</span>
                      <span className="text-[10px] font-medium text-slate-400">{interaction.date}</span>
                    </div>

                    {interaction.type === 'email' && interaction.id && interaction.id.startsWith('email-') && (
                      <button
                        onClick={() => setReplyingTo({ id: interaction.id, summary: interaction.summary })}
                        className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100"
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{interaction.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">AI Strategy</span>
          </div>
          <p className="text-sm text-indigo-800 font-medium leading-relaxed mb-4">
            Based on the technical demo, {contact.name} is looking for a long-term integration partner. The pricing proposal should emphasize the multi-year support plan.
          </p>
          <button
            onClick={() => {
              setComposeSubject(`Follow up: ${contact.company}`);
              setIsComposing(true);
            }}
            className="w-full bg-indigo-600 text-white text-xs font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            Draft Follow-up Email
          </button>
        </div>
      </div>

      {/* Reply Modal Overlay */}
      {replyingTo && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-lg">Reply to {contact.name}</h3>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-100 rounded-lg"><XCircle size={20} className="text-slate-400" /></button>
            </div>

            {/* Scrollable Email Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-100 p-4 mb-4">
              {isLoadingBody ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                  <span className="ml-2 text-xs">Loading email content...</span>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Original Message</div>
                  <div
                    className="prose prose-sm max-w-none text-slate-700 font-medium"
                    dangerouslySetInnerHTML={{ __html: replyingTo.body || replyingTo.summary }}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleReply} className="shrink-0">
              <textarea
                className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none shadow-sm"
                placeholder="Type your reply here..."
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setReplyingTo(null)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl">Cancel</button>
                <button
                  type="submit"
                  disabled={isSending || !replyBody.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Compose Modal Overlay */}
      {isComposing && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-lg">New Message to {contact.name}</h3>
              <button onClick={() => setIsComposing(false)} className="p-1 hover:bg-slate-100 rounded-lg"><XCircle size={20} className="text-slate-400" /></button>
            </div>

            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700">
                  {contact.email}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <input
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Subject line..."
                  required
                />
              </div>

              <div className="flex-1 mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Message</label>
                <textarea
                  className="w-full h-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none shadow-sm"
                  placeholder="Type your message here..."
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setIsComposing(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-xl">Cancel</button>
                <button
                  type="submit"
                  disabled={isSending || !composeSubject.trim() || !composeBody.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={16} />
                  {isSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ContactsView;
