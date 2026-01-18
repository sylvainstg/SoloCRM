
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
  Clock
} from 'lucide-react';
import { Contact, LeadStage } from '../types';
import { STAGE_COLORS, STAGES_ORDER } from '../constants';

interface Props {
  contacts: Contact[];
  updateContactStage: (id: string, newStage: LeadStage) => void;
}

import KanbanBoard from './KanbanBoard';

const ContactsView: React.FC<Props> = ({ contacts, updateContactStage }) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!isDesktop && (
        <div className="px-6 py-4 mb-2">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Pipeline</h2>
          <p className="text-xs text-slate-500 font-medium">Swipe cards to progress deal stages</p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isDesktop ? (
          <div className="h-full p-4 overflow-x-auto">
            <KanbanBoard
              contacts={contacts}
              onStageChange={updateContactStage}
              onContactClick={setSelectedContact}
            />
          </div>
        ) : (
          <div className="px-6 pb-10 overflow-y-auto h-full space-y-4 no-scrollbar">
            <AnimatePresence>
              {contacts.map((contact) => (
                <ContactSwipeCard
                  key={contact.id}
                  contact={contact}
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
  onStageChange: (stage: LeadStage) => void;
  onClick: () => void;
}> = ({ contact, onStageChange, onClick }) => {
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
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              {contact.name.split(' ').map(n => n[0]).join('')}
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 capitalize">{interaction.type}</span>
                    <span className="text-[10px] font-medium text-slate-400">{interaction.date}</span>
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
          <button className="w-full bg-indigo-600 text-white text-xs font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
            Draft Follow-up Email
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactsView;
