import React from 'react';
import { motion } from 'framer-motion';
import { Contact, LeadStage } from '../types';
import { STAGE_COLORS, STAGES_ORDER } from '../constants';
import { Building2, Plus, MoreHorizontal } from 'lucide-react';

interface Props {
    contacts: Contact[];
    onStageChange: (id: string, newStage: LeadStage) => void;
    onContactClick: (contact: Contact) => void;
}

const KanbanBoard: React.FC<Props> = ({ contacts, onStageChange, onContactClick }) => {
    // Use correct stages from types.ts
    // STAGES_ORDER likely needs to be defined if imported, or just define local order
    const displayStages = [
        LeadStage.LEAD,
        LeadStage.QUALIFICATION,
        LeadStage.PROPOSAL,
        LeadStage.NEGOTIATION,
        LeadStage.WON
    ];

    const columns = displayStages.map(stage => ({
        id: stage,
        title: stage.charAt(0) + stage.slice(1).toLowerCase(),
        contacts: contacts.filter(c => c.stage === stage)
    }));

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2">
            {columns.map(col => (
                <div key={col.id} className="flex-shrink-0 w-72 flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100 h-full max-h-full">
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-50/50 backdrop-blur-sm rounded-t-2xl z-10">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${col.id === LeadStage.LEAD ? 'bg-blue-400' :
                                    col.id === LeadStage.QUALIFICATION ? 'bg-indigo-400' :
                                        col.id === LeadStage.PROPOSAL ? 'bg-amber-400' :
                                            col.id === LeadStage.NEGOTIATION ? 'bg-purple-400' :
                                                col.id === LeadStage.WON ? 'bg-emerald-400' : 'bg-slate-300'
                                }`} />
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.title}</h3>
                            <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                {col.contacts.length}
                            </span>
                        </div>
                        {col.id === LeadStage.LEAD && (
                            <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 custom-scrollbar">
                        {col.contacts.map(contact => (
                            <KanbanCard
                                key={contact.id}
                                contact={contact}
                                onClick={() => onContactClick(contact)}
                                onNext={() => {
                                    const currentIndex = displayStages.indexOf(contact.stage);
                                    if (currentIndex < displayStages.length - 1) {
                                        onStageChange(contact.id, displayStages[currentIndex + 1]);
                                    }
                                }}
                                onPrev={() => {
                                    const currentIndex = displayStages.indexOf(contact.stage);
                                    if (currentIndex > 0) {
                                        onStageChange(contact.id, displayStages[currentIndex - 1]);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const KanbanCard: React.FC<{
    contact: Contact;
    onClick: () => void;
    onNext: () => void;
    onPrev: () => void;
}> = ({ contact, onClick, onNext, onPrev }) => {
    return (
        <motion.div
            layoutId={contact.id}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group cursor-pointer relative"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 text-sm">{contact.name}</h4>
                <button className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <div className="flex items-center gap-1.5 mb-3 text-slate-500">
                <Building2 size={12} />
                <p className="text-xs font-medium truncate">{contact.company}</p>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <span className="text-xs font-bold text-slate-700">${(contact.value / 1000).toFixed(1)}k</span>

                {/* Quick Move Arrows on Hover - Desktop Friendly Alternative to Drag */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onPrev} className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-slate-600">←</button>
                    <button onClick={onNext} className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-indigo-600">→</button>
                </div>
            </div>
        </motion.div>
    );
};

export default KanbanBoard;
