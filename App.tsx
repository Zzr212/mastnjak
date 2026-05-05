import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut,
  CalendarCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';
import { SmartCard, FilterType } from './components/SmartCard'; 
import { StatCard } from './components/StatCard'; 
import { RevenueChart } from './components/RevenueChart';
import { RecentActivity } from './components/RecentActivity';
import { DailyLog } from './components/DailyLog';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { NotesView } from './components/NotesView'; 
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { formatCurrency, formatDuration } from './utils/formatters';
import { Language, getTranslation } from './utils/translations';

type ViewType = 'dashboard' | 'history' | 'settings' | 'profile' | 'notes';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || 'Driver');
  const [language, setLanguage] = useState<Language>((localStorage.getItem('language') as Language) || 'en');
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false);

  // Data State
  const [ratePerKm, setRatePerKm] = useState(0.12);
  const [logs, setLogs] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Filters
  const [earningsFilter, setEarningsFilter] = useState<FilterType>('today');
  const [earningsCustomRange, setEarningsCustomRange] = useState({ start: '', end: '' });

  // Helpers
  const t = (key: any) => getTranslation(language, key);
  const todayStr = new Date().toISOString().split('T')[0];
  const hasNotesToday = notes.some(n => n.reminder_date === todayStr);

  const handleLogin = (newToken: string, user: string, lang: Language) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', user);
    localStorage.setItem('language', lang);
    setToken(newToken);
    setUsername(user);
    setLanguage(lang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('language');
    setToken(null);
  };

  const handleUpdateLanguage = async (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    if(token) {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ language: lang })
        });
    }
  };

  // Fetch Data
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setRatePerKm(data.settings.rate_per_km);
      if(data.settings.language) setLanguage(data.settings.language);
      
      setLogs(data.logs);
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Actions
  const updateSettings = async (newRate: number) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ rate_per_km: newRate })
      });
      setRatePerKm(newRate);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDailyLogSave = async (data: any) => {
     try {
       await fetch('/api/logs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
         body: JSON.stringify({ date: todayStr, ...data })
       });
       fetchData();
     } catch (err) { throw err; }
  };

  const handleLogUpdate = async (updatedLog: any) => {
    try {
       const dist = Math.max(0, updatedLog.end_km - updatedLog.start_km);
       const newTotal = (dist * ratePerKm) + updatedLog.wage;
       await fetch('/api/logs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
         body: JSON.stringify({ ...updatedLog, total_earnings: newTotal })
       });
       fetchData();
    } catch (err) { alert('Failed'); }
  };

  const handleDeleteLog = async (id: number) => {
      if (!confirm(t('confirm') + '?')) return;
      await fetch(`/api/logs/${id}`, {
          method: 'DELETE',
          headers: {'Authorization': `Bearer ${token}`}
      });
      fetchData();
  };

  const handleAddNote = async (content: string, date: string) => {
      await fetch('/api/notes', {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
          body: JSON.stringify({ content, reminder_date: date })
      });
      fetchData();
  };

  const handleDeleteNote = async (id: number) => {
      await fetch(`/api/notes/${id}`, {
          method: 'DELETE',
          headers: {'Authorization': `Bearer ${token}`}
      });
      fetchData();
  };

  // Calculations (Simplified)
  const isDateInMonth = (dateStr: string) => {
    const d = new Date(dateStr); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const isDateInRange = (dateStr: string, start: string, end: string) => {
    if (!start || !end) return false;
    const d = new Date(dateStr).getTime(); const s = new Date(start).getTime(); const e = new Date(end).getTime();
    return d >= s && d <= e;
  };
  const isToday = (dateStr: string) => dateStr === todayStr;

  const getEarningsStats = () => {
    let filtered = [];
    if (earningsFilter === 'today') filtered = logs.filter(l => isToday(l.date));
    else if (earningsFilter === 'month') filtered = logs.filter(l => isDateInMonth(l.date));
    else if (earningsFilter === 'custom') filtered = logs.filter(l => isDateInRange(l.date, earningsCustomRange.start, earningsCustomRange.end));
    
    return {
      earnings: filtered.reduce((sum, l) => sum + (l.total_earnings || 0), 0),
      km: filtered.reduce((sum, l) => sum + Math.max(0, (l.end_km || 0) - (l.start_km || 0)), 0),
      wages: filtered.filter(l => (l.wage || 0) > 0).length
    };
  };

  const stats = getEarningsStats();

  if (!token) return <LandingPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 pb-20 lg:pb-0 relative overflow-hidden">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex-col shadow-2xl">
        <div className="h-24 flex items-center px-8 border-b border-slate-800">
           <div>
             <h1 className="text-xl font-black tracking-tighter text-white text-indigo-400 flex items-center gap-2">
                 Driver
             </h1>
             <p className="text-lg font-bold text-white tracking-widest">Dashboard</p>
           </div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label={t('dashboard')} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<CheckCircle2 size={20} />} label={t('notes')} active={currentView === 'notes'} onClick={() => setCurrentView('notes')} hasDot={hasNotesToday} />
          <NavItem icon={<Wallet size={20} />} label={t('history')} active={currentView === 'history'} onClick={() => setCurrentView('history')} />
          <NavItem icon={<Settings size={20} />} label={t('settings')} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <button onClick={() => setCurrentView('profile')} className="flex items-center gap-3 w-full hover:bg-slate-800 p-2 rounded-xl transition-colors text-left">
             <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {username.charAt(0).toUpperCase()}
             </div>
             <div>
                <p className="font-bold text-sm text-white">{username}</p>
                <p className="text-xs text-slate-400">{t('profile')}</p>
             </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64">
        <header className="h-16 lg:h-20 bg-white/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-10 shrink-0 sticky top-0 z-20 border-b border-white/50">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
             <h2 className="text-lg lg:text-xl font-bold text-slate-800">
               {t(currentView === 'dashboard' ? 'dashboard' : currentView === 'history' ? 'history' : currentView === 'profile' ? 'profile' : currentView === 'notes' ? 'notes' : 'settings')}
             </h2>
          </div>
          {currentView !== 'profile' && (
            <div className="flex items-center space-x-2 lg:space-x-4">
               {currentView === 'dashboard' && (
                 <button 
                   onClick={() => setIsDailyEntryOpen(true)} 
                   className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-1"
                 >
                   <Plus size={20} />
                   <span className="hidden sm:inline text-sm font-bold pr-1">Entry</span>
                 </button>
               )}
               <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-xl hover:bg-white border border-transparent hover:border-slate-200">
                 <RefreshCw size={20} className={isLoading ? "animate-spin text-indigo-600" : ""} />
               </button>
               <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <CalendarCheck size={16} className="text-indigo-500" />
                  <span>{new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'bs' ? 'bs-BA' : 'it-IT', { weekday: 'short', day: '2-digit', month: 'long' })}</span>
               </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6 pb-24">
            
            {currentView === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SmartCard 
                    title={t('earnings')} 
                    value={formatCurrency(stats.earnings)} 
                    icon={<Wallet className="text-indigo-600" />} 
                    filterType={earningsFilter} 
                    onFilterChange={setEarningsFilter} 
                    customRange={earningsCustomRange} 
                    onCustomRangeChange={(s, e) => setEarningsCustomRange({ start: s, end: e })} 
                    trendUp={true} 
                    ratePerKm={ratePerKm}
                    totalKm={stats.km}
                    totalWages={stats.wages}
                  />
                  <div className="md:col-span-1 lg:col-span-2 space-y-6">
                     <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full min-h-[300px]">
                       <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-slate-400" /> Revenue Analytics</h3>
                       <div className="h-[280px] w-full"><RevenueChart data={logs} /></div>
                     </div>
                  </div>
                </div>
              </>
            )}

            {currentView === 'history' && <RecentActivity logs={logs} austriaSessions={[]} onUpdateLog={handleLogUpdate} onDeleteLog={handleDeleteLog} onDeleteAustriaSession={() => {}} lang={language} />}
            {currentView === 'settings' && <SettingsView ratePerKm={ratePerKm} setRatePerKm={updateSettings} language={language} setLanguage={handleUpdateLanguage} />}
            {currentView === 'profile' && <ProfileView username={username} ratePerKm={ratePerKm} onLogout={handleLogout} onBack={() => setCurrentView('dashboard')} lang={language} />}
            {currentView === 'notes' && <NotesView notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} lang={language} />}
          </div>
        </div>
      </main>
      
      {/* Daily Entry Sliding Panel */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isDailyEntryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDailyEntryOpen(false)} />
        <div className={`absolute top-0 right-0 w-full max-w-md h-full bg-slate-50 shadow-2xl transition-transform duration-300 transform ${isDailyEntryOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto flex flex-col`}>
           <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800">New Daily Entry</h2>
              <button onClick={() => setIsDailyEntryOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                 <X size={20} />
              </button>
           </div>
           <div className="p-6 flex-1">
              <DailyLog 
                ratePerKm={ratePerKm} 
                initialStartKm={logs.length > 0 ? String(logs[0].end_km || '') : ''}
                onSave={async (data) => { await handleDailyLogSave(data); setIsDailyEntryOpen(false); }} 
              />
           </div>
        </div>
      </div>

      <BottomNav currentView={currentView} onChangeView={setCurrentView} username={username} hasNotification={hasNotesToday} />
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; hasDot?: boolean }> = ({ icon, label, active, onClick, hasDot }) => (
  <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
    {icon} <span>{label}</span>
    {hasDot && <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
  </button>
);

export default App;