import React, { useState } from 'react';
import { Search, Undo2, Ban } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    ignoredEmails: Set<string>;
    onUnignore: (email: string) => void;
    emailHistoryDays: number;
    onUpdateHistoryDays: (days: number) => void;
}

const SettingsView: React.FC<Props> = ({ ignoredEmails, onUnignore, emailHistoryDays, onUpdateHistoryDays }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const emailsList = Array.from(ignoredEmails).sort();

    const filteredEmails = emailsList.filter(email =>
        email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col p-6 max-w-4xl mx-auto w-full space-y-6">
            <div className="">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Settings</h2>
                <p className="text-slate-500">Manage your application preferences and ignored contacts.</p>
            </div>

            {/* Sync Preferences */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Sync Preferences</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-700">Email History Window</p>
                        <p className="text-xs text-slate-400 mt-1">How far back should we check for emails?</p>
                    </div>
                    <select
                        value={emailHistoryDays}
                        onChange={(e) => onUpdateHistoryDays(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-bold outline-none"
                    >
                        <option value={3}>Last 3 Days</option>
                        <option value={7}>Last 7 Days (Default)</option>
                        <option value={14}>Last 2 Weeks</option>
                        <option value={30}>Last 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 max-h-[600px]">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500">
                            <Ban size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Ignored Emails</h3>
                            <p className="text-xs text-slate-400 font-medium">Manage senders you've hidden from your inbox</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search ignored emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-100 rounded-xl text-sm transition-all outline-none w-64"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredEmails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <p className="text-sm font-medium">No ignored emails found</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredEmails.map(email => (
                                <motion.div
                                    layout
                                    key={email}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                            {email[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">{email}</span>
                                    </div>

                                    <button
                                        onClick={() => onUnignore(email)}
                                        className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <Undo2 size={14} />
                                        Restore
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        Restored emails will appear in your inbox the next time you sync.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
