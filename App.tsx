import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  BarChart3,
  Calendar as CalendarIcon,
  Mail,
  Settings,
  Plus,
  Search,
  LayoutDashboard
} from 'lucide-react';
import { Contact, LeadStage } from './types';
import DashboardView from './components/DashboardView';
import ContactsView from './components/ContactsView';
import CalendarView from './components/CalendarView';
import EmailSyncView from './components/EmailSyncView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeToContacts, updateContactStage as updateStageInDb, seedInitialContacts } from './services/firestoreService';

const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    company: 'Nexus Tech',
    email: 'sarah@nexustech.io',
    phone: '+1 555-0102',
    stage: LeadStage.NEGOTIATION,
    value: 12500,
    lastInteractionDate: '2024-05-18',
    interactions: [
      { id: 'i1', type: 'email', date: '2024-05-18', summary: 'Sent pricing proposal', sentiment: 'positive' },
      { id: 'i2', type: 'meeting', date: '2024-05-15', summary: 'Technical demo of the platform', sentiment: 'positive' }
    ],
    aiInsight: 'Sarah is showing strong intent. Focus on the API scalability in the next talk.'
  },
  {
    id: '2',
    name: 'Marcus Miller',
    company: 'Green Horizon',
    email: 'm.miller@gh.com',
    phone: '+1 555-0199',
    stage: LeadStage.LEAD,
    value: 5000,
    lastInteractionDate: '2024-05-20',
    interactions: [
      { id: 'i3', type: 'note', date: '2024-05-20', summary: 'Met at NetZero conference', sentiment: 'neutral' }
    ]
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    company: 'Global Logistics',
    email: 'elena.r@globallog.com',
    phone: '+1 555-0344',
    stage: LeadStage.PROPOSAL,
    value: 28000,
    lastInteractionDate: '2024-05-12',
    interactions: [
      { id: 'i4', type: 'call', date: '2024-05-12', summary: 'Discussed Q3 rollout plan', sentiment: 'positive' }
    ]
  }
];

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'calendar' | 'email'>('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Subscribe to Firestore contacts
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToContacts(user.uid, (newContacts) => {
      if (newContacts.length === 0 && !isLoaded) {
        // Initial seed if empty
        seedInitialContacts(user.uid, MOCK_CONTACTS);
      } else {
        setContacts(newContacts);
      }
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [user]);


  const filteredContacts = useMemo(() => {
    return contacts.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const updateContactStage = (id: string, newStage: LeadStage) => {
    // Optimistic update
    setContacts(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
    if (user) {
      updateStageInDb(user.uid, id, newStage);
    }
  };

  const renderContent = () => {
    if (!isLoaded) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading your pipeline...</div>;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView contacts={contacts} setActiveTab={setActiveTab} />;
      case 'contacts':
        return <ContactsView contacts={filteredContacts} updateContactStage={updateContactStage} />;
      case 'calendar':
        return <CalendarView />;
      case 'email':
        return <EmailSyncView />;
      default:
        return <DashboardView contacts={contacts} setActiveTab={setActiveTab} />;
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden border-x border-slate-100 items-center justify-center px-6">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
          <h1 className="text-3xl font-bold text-white tracking-tighter">Solo</h1>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-center text-slate-500 mb-10 leading-relaxed">
          Your personal AI CRM assistant is ready to help you close more deals.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
        <p className="text-[10px] text-slate-400 mt-8 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-100 h-full">
        <div className="p-6 border-b border-slate-50">
          <h1 className="text-2xl font-bold text-indigo-700 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <LayoutDashboard size={18} />
            </div>
            SoloCRM
          </h1>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <SidebarLink
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <SidebarLink
            active={activeTab === 'contacts'}
            onClick={() => setActiveTab('contacts')}
            icon={<Users size={20} />}
            label="Pipeline"
          />
          <SidebarLink
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon={<CalendarIcon size={20} />}
            label="Events"
          />
          <SidebarLink
            active={activeTab === 'email'}
            onClick={() => setActiveTab('email')}
            icon={<Mail size={20} />}
            label="Inbox"
          />
        </div>

        <div className="p-4 border-t border-slate-50">
          <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3 mb-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user.displayName ? user.displayName[0] : 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full text-xs font-bold text-slate-500 hover:text-red-500 py-2 transition-colors flex items-center justify-center gap-2"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-white md:bg-slate-50/50 relative overflow-hidden">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SoloCRM</h1>
            <p className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Search size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              {user.photoURL ? <img src={user.photoURL} className="w-full h-full rounded-full" /> : (user.displayName?.[0] || 'U')}
            </div>
          </div>
          {/* Mobile Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-4 top-16 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => { signOut(); setShowProfileMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex px-8 py-5 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Dashboard' :
                activeTab === 'contacts' ? 'Deals Pipeline' :
                  activeTab === 'calendar' ? 'Calendar' : 'Inbox'}
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64"
              />
            </div>
            <button className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors shadow-sm">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-6 md:px-8">
          {renderContent()}
        </main>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40">
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
          <NavButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={20} />} label="Pipeline" />
          <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={<CalendarIcon size={20} />} label="Events" />
          <NavButton active={activeTab === 'email'} onClick={() => setActiveTab('email')} icon={<Mail size={20} />} label="Inbox" />
        </nav>

        {/* Floating Add Button (Mobile) */}
        {activeTab === 'contacts' && (
          <button className="md:hidden absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 z-30">
            <Plus size={28} />
          </button>
        )}
      </div>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {icon}
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default App;
