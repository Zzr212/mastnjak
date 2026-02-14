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
  CheckCircle2
} from 'lucide-react';
import { SmartCard, FilterType } from './components/SmartCard'; 
import { StatCard } from './components/StatCard'; 
import { RevenueChart } from './components/RevenueChart';
import { RecentActivity } from './components/RecentActivity';
import { AustriaControls } from './components/AustriaControls';
import { DailyLog } from './components/DailyLog';
import { SettingsView } from './components/SettingsView';
import { ProfileView } from './components/ProfileView';
import { NotesView } from './components/NotesView'; 
import { BottomNav } from './components/BottomNav';
import { LandingPage } from './components/LandingPage'; // Updated import
import { formatCurrency, formatDuration } from './utils/formatters';
import { Language, getTranslation } from './utils/translations';

type ViewType = 'dashboard' | 'history' | 'settings' | 'profile' | 'notes';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || 'Driver');
  const [language, setLanguage] = useState<Language>((localStorage.getItem('language') as Language) || 'en');
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [ratePerKm, setRatePerKm] = useState(0.12);
  const [logs, setLogs] = useState<any[]>([]);
  const [austriaLogs, setAustriaLogs] = useState<any[]>([]); 
  const [austriaSessions, setAustriaSessions] = useState<any[]>([]); 
  const [notes, setNotes] = useState<any[]>([]);
  
  const [austriaState, setAustriaState] = useState({
    total_seconds: 0,
    is_active: false,
    last_start_timestamp: null as number | null
  });

  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(0);

  // Filters
  const [earningsFilter, setEarningsFilter] = useState<FilterType>('today');
  const [earningsCustomRange, setEarningsCustomRange] = useState({ start: '', end: '' });

  const [austriaFilter, setAustriaFilter] = useState<FilterType>('today');
  const [austriaCustomRange, setAustriaCustomRange] = useState({ start: '', end: '' });

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
      setAustriaLogs(data.austria_logs || []); 
      setAustriaSessions(data.austria_sessions || []); 
      setNotes(data.notes || []);
      setAustriaState(data.austria);
      
      if (data.austria.is_active && data.austria.last_start_timestamp) {
        setCurrentSessionSeconds(Math.floor((Date.now() - data.austria.last_start_timestamp) / 1000));
      } else {
        setCurrentSessionSeconds(0);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  useEffect(() => {
    let interval: number;
    if (austriaState.is_active && austriaState.last_start_timestamp) {
      interval = window.setInterval(() => {
        setCurrentSessionSeconds(Math.floor((Date.now() - (austriaState.last_start_timestamp as number)) / 1000));
      }, 1000);
    } else {
      setCurrentSessionSeconds(0);
    }
    return () => clearInterval(interval);
  }, [austriaState]);

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

  const toggleAustria = async () => {
    try {
      const res = await fetch('/api/austria/toggle', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAustriaState({
        total_seconds: data.total_seconds,
        is_active: data.is_active,
        last_start_timestamp: data.is_active ? Date.now() : null
      });
      if (!data.is_active) setCurrentSessionSeconds(0);
      setTimeout(fetchData, 100); 
    } catch (err) { console.error(err); }
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

  const getDisplayedEarnings = () => {
    if (earningsFilter === 'today') return logs.find(l => isToday(l.date))?.total_earnings || 0;
    if (earningsFilter === 'month') return logs.filter(l => isDateInMonth(l.date)).reduce((sum, l) => sum + l.total_earnings, 0);
    if (earningsFilter === 'custom') return logs.filter(l => isDateInRange(l.date, earningsCustomRange.start, earningsCustomRange.end)).reduce((sum, l) => sum + l.total_earnings, 0);
    return 0;
  };

  const getDisplayedAustriaTime = () => {
    if (austriaFilter === 'today') return austriaState.total_seconds + currentSessionSeconds;
    const historicalSum = austriaLogs.filter(log => {
        if (log.date === todayStr) return false;
        if (austriaFilter === 'month') return isDateInMonth(log.date);
        if (austriaFilter === 'custom') return isDateInRange(log.date, austriaCustomRange.start, austriaCustomRange.end);
        return false;
      }).reduce((acc, curr) => acc + curr.total_seconds, 0);
    let addToday = austriaFilter === 'month' || (austriaFilter === 'custom' && isDateInRange(todayStr, austriaCustomRange.start, austriaCustomRange.end));
    return historicalSum + (addToday ? (austriaState.total_seconds + currentSessionSeconds) : 0);
  };

  if (!token) return <LandingPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 pb-20 lg:pb-0">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex-col shadow-2xl">
        <div className="h-24 flex items-center px-8 border-b border-slate-800">
           <div>
             <h1 className="text-2xl font-black tracking-tighter text-white">MASTNAK</h1>
             <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Driver Intelligence</p>
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
            <div className="flex items-center space-x-4">
               <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-white">
                 <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
               </button>
               <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 bg-white/50 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <CalendarCheck size={16} className="text-indigo-500" />
                  <span>{new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE', { weekday: 'short', day: '2-digit', month: 'long' })}</span>
               </div>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6 pb-24">
            
            {currentView === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SmartCard title={t('earnings')} value={formatCurrency(getDisplayedEarnings())} icon={<Wallet className="text-indigo-600" />} filterType={earningsFilter} onFilterChange={setEarningsFilter} customRange={earningsCustomRange} onCustomRangeChange={(s, e) => setEarningsCustomRange({ start: s, end: e })} trendUp={true} />
                  <SmartCard title={t('austriaTime')} value={formatDuration(getDisplayedAustriaTime())} icon={<Clock className="text-rose-600" />} filterType={austriaFilter} onFilterChange={setAustriaFilter} customRange={austriaCustomRange} onCustomRangeChange={(s, e) => setAustriaCustomRange({ start: s, end: e })} subtitle={austriaState.is_active ? t('recording') : t('idle')} />
                  <StatCard title={t('currentRate')} value={`${formatCurrency(ratePerKm)}/km`} icon={<MapPin className="text-emerald-600" />} subtitle={t('config')} />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                     <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                       <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-slate-400" /> Revenue Analytics</h3>
                       <div className="h-[280px] w-full"><RevenueChart data={logs} /></div>
                     </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <AustriaControls isInsideAustria={austriaState.is_active} currentSessionTime={currentSessionSeconds} onToggle={toggleAustria} />
                    <DailyLog ratePerKm={ratePerKm} onSave={handleDailyLogSave} />
                  </div>
                </div>
              </>
            )}

            {currentView === 'history' && <RecentActivity logs={logs} austriaSessions={austriaSessions} onUpdateLog={handleLogUpdate} />}
            {currentView === 'settings' && <SettingsView ratePerKm={ratePerKm} setRatePerKm={updateSettings} language={language} setLanguage={handleUpdateLanguage} />}
            {currentView === 'profile' && <ProfileView username={username} ratePerKm={ratePerKm} onLogout={handleLogout} onBack={() => setCurrentView('dashboard')} lang={language} />}
            {currentView === 'notes' && <NotesView notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} lang={language} />}
          </div>
        </div>
      </main>
      
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