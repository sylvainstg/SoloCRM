import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Contact, LeadStage } from '../types';
import { Building2, Plus, Clock, Mail, Phone, Users, FileText, XCircle } from 'lucide-react';

interface Props {
    contacts: Contact[];
    onStageChange: (id: string, newStage: LeadStage) => void;
    onContactClick: (contact: Contact) => void;
    onUpdateContact: (id: string, data: Partial<Contact>) => void;
    onAddContact?: () => void;
}

type SortOption = 'idle' | 'alpha' | 'age';

const KanbanBoard: React.FC<Props> = ({ contacts, onStageChange, onContactClick, onUpdateContact, onAddContact }) => {
    const [sortBy, setSortBy] = useState<SortOption>('idle');

    const displayStages = [
        LeadStage.LEAD,
        LeadStage.QUALIFICATION,
        LeadStage.PROPOSAL,
        LeadStage.NEGOTIATION,
        LeadStage.WON,
        LeadStage.LOST
    ];

    const getIdleDays = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    const sortContacts = (list: Contact[]) => {
        return [...list].sort((a, b) => {
            if (sortBy === 'alpha') return a.name.localeCompare(b.name);
            if (sortBy === 'age') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            // Default: Idle (Descending - most stuck first)
            return getIdleDays(b.stageLastUpdated) - getIdleDays(a.stageLastUpdated);
        });
    };

    const columns = displayStages.map(stage => ({
        id: stage,
        title: stage,
        contacts: sortContacts(contacts.filter(c => c.stage === stage))
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Board Controls */}
            <div className="flex justify-end px-6 py-2 gap-2">
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    {(['idle', 'alpha', 'age'] as SortOption[]).map(option => (
                        <button
                            key={option}
                            onClick={() => setSortBy(option)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all capitalize ${sortBy === option ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {option === 'idle' ? 'Stuck' : option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex h-full gap-4 overflow-x-auto pb-4 px-6 no-scrollbar">
                {columns.map(col => (
                    <div key={col.id} className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full max-h-full">
                        {/* Column Header */}
                        <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-100/50 backdrop-blur-sm rounded-t-2xl z-10">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${col.id === LeadStage.LEAD ? 'bg-blue-400' :
                                    col.id === LeadStage.QUALIFICATION ? 'bg-indigo-400' :
                                        col.id === LeadStage.PROPOSAL ? 'bg-amber-400' :
                                            col.id === LeadStage.NEGOTIATION ? 'bg-purple-400' :
                                                col.id === LeadStage.WON ? 'bg-emerald-400' :
                                                    col.id === LeadStage.LOST ? 'bg-red-400' : 'bg-slate-300'
                                    }`} />
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.title}</h3>
                                <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                                    {col.contacts.length}
                                </span>
                            </div>
                            {col.id === LeadStage.LEAD && (
                                <button
                                    onClick={onAddContact}
                                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                                >
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
                                    onUpdate={(data) => onUpdateContact(contact.id, data)}
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
                                    onLose={() => onStageChange(contact.id, LeadStage.LOST)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const KanbanCard: React.FC<{
    contact: Contact;
    onClick: () => void;
    onUpdate: (data: Partial<Contact>) => void;
    onNext: () => void;
    onPrev: () => void;
    onLose: () => void;
}> = ({ contact, onClick, onUpdate, onNext, onPrev, onLose }) => {
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [editValue, setEditValue] = useState(contact.value.toString());

    // Activity Stack Logic
    const recentActivity = [...(contact.interactions || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    const getIdleDays = (dateStr?: string) => {
        if (!dateStr) return 0;
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    const idleDays = getIdleDays(contact.stageLastUpdated);
    const idleColor = idleDays > 7 ? 'text-red-500 bg-red-50 border-red-100' :
        idleDays > 3 ? 'text-amber-500 bg-amber-50 border-amber-100' :
            'text-emerald-500 bg-emerald-50 border-emerald-100';

    const handleValueSubmit = () => {
        setIsEditingValue(false);
        const num = parseFloat(editValue);
        if (!isNaN(num)) {
            onUpdate({ value: num });
        }
    };

    return (
        <motion.div
            layoutId={contact.id}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group cursor-pointer relative"
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 text-sm truncate pr-2">{contact.name}</h4>
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${idleColor} flex items-center gap-1`}>
                    <Clock size={10} />
                    {idleDays}d
                </div>
            </div>

            <div className="flex items-center gap-1.5 mb-4 text-slate-500">
                <Building2 size={12} />
                <p className="text-xs font-medium truncate">{contact.company}</p>
            </div>

            {/* Brief Activity Stack */}
            {recentActivity.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pl-1">
                    {recentActivity.map((interaction, i) => (
                        <div
                            key={interaction.id || i}
                            className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400"
                            title={`${interaction.type} - ${interaction.date}`}
                        >
                            {interaction.type === 'email' ? <Mail size={12} /> :
                                interaction.type === 'call' ? <Phone size={12} /> :
                                    interaction.type === 'meeting' ? <Users size={12} /> : <FileText size={12} />}
                        </div>
                    ))}
                    {contact.interactions?.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium">+{contact.interactions.length - 3}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 relative">
                {isEditingValue ? (
                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                        <span className="text-xs font-bold text-slate-700 mr-1">$</span>
                        <input
                            autoFocus
                            type="number"
                            className="w-20 text-xs font-bold bg-slate-50 border border-indigo-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={handleValueSubmit}
                            onKeyDown={e => e.key === 'Enter' && handleValueSubmit()}
                        />
                    </div>
                ) : (
                    <span
                        className="text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-1 -ml-1 rounded transition-colors cursor-text"
                        onClick={(e) => { e.stopPropagation(); setIsEditingValue(true); }}
                        title="Click to edit value"
                    >
                        ${(contact.value / 1000).toFixed(1)}k
                    </span>
                )}

                {/* Quick Move Arrows on Hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {contact.stage !== LeadStage.LOST && (
                        <button onClick={onLose} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500" title="Mark Lost">
                            <XCircle size={14} />
                        </button>
                    )}
                    <button onClick={onPrev} className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-slate-600">←</button>
                    <button onClick={onNext} className="p-1 hover:bg-slate-50 rounded text-slate-300 hover:text-indigo-600">→</button>
                </div>
            </div>
        </motion.div>
    );
};

export default KanbanBoard;
