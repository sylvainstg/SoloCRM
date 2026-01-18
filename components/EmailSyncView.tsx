import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listEmails } from '../services/gmailService';
import { EmailThread } from '../types';

const EmailSyncView: React.FC = () => {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { googleAccessToken, signInWithGoogle } = useAuth(); // User needs to re-auth if no token

  const fetchEmails = async () => {
    if (!googleAccessToken) {
      // If we don't have a token (e.g. page reload without session persistence working fully, or initial load), 
      // we might need to prompt user.
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listEmails(googleAccessToken);
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

  if (!googleAccessToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-indigo-50 p-4 rounded-full mb-4 text-indigo-600">
          <Mail size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connect to Gmail</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          We need your permission to access your emails. Please sign in again to grant access.
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

  return (
    <div className="py-6 px-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Inbox</h2>
          <p className="text-xs text-slate-500 font-medium">Synced with Gmail</p>
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

      {loading && threads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-20">
          {threads.length === 0 ? (
            <div className="text-center text-slate-400 mt-10">No recent emails found.</div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 text-sm truncate pr-4">{thread.from}</h3>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{thread.date}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mb-1 truncate">{thread.subject}</p>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {thread.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EmailSyncView;
