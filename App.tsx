
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contacts' | 'calendar' | 'email'>('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load contacts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('solocrm_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        setContacts(MOCK_CONTACTS);
      }
    } else {
      setContacts(MOCK_CONTACTS);
    }
    setIsLoaded(true);
  }, []);

  // Save contacts to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('solocrm_contacts', JSON.stringify(contacts));
    }
  }, [contacts, isLoaded]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contacts, searchQuery]);

  const updateContactStage = (id: string, newStage: LeadStage) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, stage: newStage } : c));
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

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden border-x border-slate-100">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b border-slate-100 bg-white sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SoloCRM</h1>
          <p className="text-xs text-slate-500 font-medium">May 21, 2024</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <Search size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar pb-24">
        {renderContent()}
      </main>

      {/* Add Button - Floating Action Button Style */}
      {activeTab === 'contacts' && (
        <button className="absolute bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all z-30 transform hover:scale-105 active:scale-95">
          <Plus size={28} />
        </button>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<LayoutDashboard size={20} />} 
          label="Home" 
        />
        <NavButton 
          active={activeTab === 'contacts'} 
          onClick={() => setActiveTab('contacts')} 
          icon={<Users size={20} />} 
          label="Pipeline" 
        />
        <NavButton 
          active={activeTab === 'calendar'} 
          onClick={() => setActiveTab('calendar')} 
          icon={<CalendarIcon size={20} />} 
          label="Events" 
        />
        <NavButton 
          active={activeTab === 'email'} 
          onClick={() => setActiveTab('email')} 
          icon={<Mail size={20} />} 
          label="Inbox" 
        />
      </nav>
    </div>
  );
};

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
