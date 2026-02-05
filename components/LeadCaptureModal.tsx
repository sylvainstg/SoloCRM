import React, { useState } from 'react';
import { X, Save, DollarSign, Calendar, FileText, User, Building, Mail, Phone } from 'lucide-react';
import { EmailThread, LeadStage } from '../types';

interface LeadCaptureModalProps {
    thread: EmailThread;
    onClose: () => void;
    onSave: (data: {
        name: string;
        company: string;
        email: string;
        phone: string;
        value: number;
        closeDate: string;
        notes: string;
    }) => void;
}

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ thread, onClose, onSave }) => {
    const [name, setName] = useState(thread.from);
    const [company, setCompany] = useState('New Lead');
    const [phone, setPhone] = useState('');
    const [value, setValue] = useState<string>('');
    const [closeDate, setCloseDate] = useState('');
    const [notes, setNotes] = useState('');

    console.log("LeadCaptureModal rendering for:", thread?.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            company,
            email: thread.email || '',
            phone,
            value: parseFloat(value) || 0,
            closeDate,
            notes
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Create Opportunity</h3>
                        <p className="text-xs text-slate-500">Convert email to pipeline deal</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Read-only Context */}
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-2">
                        <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-1">
                            <Mail size={12} />
                            <span className="truncate">{thread.email}</span>
                        </div>
                        <p className="text-xs text-indigo-600/80 truncate">Re: {thread.subject}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <User size={12} /> Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <Building size={12} /> Company
                            </label>
                            <input
                                type="text"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Phone size={12} /> Phone
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 555-0123"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <DollarSign size={12} /> Deal Value
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <Calendar size={12} /> Close Date
                            </label>
                            <input
                                type="date"
                                value={closeDate}
                                onChange={(e) => setCloseDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <FileText size={12} /> Notes / Context
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Met at conference, interested in Q3 rollout..."
                            rows={3}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={16} />
                            Create Opportunity
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default LeadCaptureModal;
