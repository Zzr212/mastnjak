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
  UserCircle
} from 'lucide-react';
import { SmartCard, FilterType } from './components/SmartCard'; // New Smart Component
import { StatCard } from './components/StatCard'; // Keeping for simple cards
import { RevenueChart } from './components/RevenueChart';
import { RecentActivity } from './components/RecentActivity';
import { AustriaControls } from './components/AustriaControls';
import { DailyLog } from './components/DailyLog';
import { SettingsView } from './components/SettingsView';
import { BottomNav } from './components/BottomNav';
import { Auth } from './components/Auth';
import { formatCurrency, formatDuration } from './utils/formatters';

type ViewType = 'dashboard' | 'history' | 'settings';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || 'Driver');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [ratePerKm, setRatePerKm] = useState(0.12);
  const [logs, setLogs] = useState<any[]>([]);
  const [austriaLogs, setAustriaLogs] = useState<any[]>([]); // New historical state
  
  // Austria Live State
  const [austriaState, setAustriaState] = useState({
    total_seconds: 0,
    is_active: false,
    last_start_timestamp: null as number | null
  });

  // Client-side timer for visual feedback
  const [displayAustriaTime, setDisplayAustriaTime] = useState(0);

  // --- FILTERS STATE ---
  const [earningsFilter, setEarningsFilter] = useState<FilterType>('today');
  const [earningsCustomRange, setEarningsCustomRange] = useState({ start: '', end: '' });

  const [austriaFilter, setAustriaFilter] = useState<FilterType>('today');
  const [austriaCustomRange, setAustriaCustomRange] = useState({ start: '', end: '' });

  // Auth Handler
  const handleLogin = (newToken: string, user: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', user);
    setToken(newToken);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
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
      setLogs(data.logs);
      setAustriaLogs(data.austria_logs || []); // Capture history
      setAustriaState(data.austria);
      
      // Calculate initial display time (Live)
      if (data.austria.is_active && data.austria.last_start_timestamp) {
        const added = Math.floor((Date.now() - data.austria.last_start_timestamp) / 1000);
        setDisplayAustriaTime(data.austria.total_seconds + added);
      } else {
        setDisplayAustriaTime(data.austria.total_seconds);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Austria Timer Tick
  useEffect(() => {
    let interval: number;
    if (austriaState.is_active && austriaState.last_start_timestamp) {
      interval = window.setInterval(() => {
        const added = Math.floor((Date.now() - (austriaState.last_start_timestamp as number)) / 1000);
        setDisplayAustriaTime(austriaState.total_seconds + added);
      }, 1000);
    } else {
      setDisplayAustriaTime(austriaState.total_seconds);
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
      // Also refetch history to keep table consistent if needed
      if (!data.is_active) fetchData(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleDailyLogSave = async (data: any) => {
     try {
       await fetch('/api/logs', {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json', 
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
             date: new Date().toISOString().split('T')[0],
             ...data 
         })
       });
       fetchData();
       alert("Daily log saved successfully!");
     } catch (err) {
       alert("Failed to save.");
     }
  };

  // --- CALCULATION HELPERS ---

  const isDateInMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isDateInRange = (dateStr: string, start: string, end: string) => {
    if (!start || !end) return false;
    const d = new Date(dateStr).getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return d >= s && d <= e;
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  // Calculate Displayed Earnings based on Filter
  const getDisplayedEarnings = () => {
    if (earningsFilter === 'today') {
      const todayLog = logs.find(l => isToday(l.date));
      return todayLog ? todayLog.total_earnings : 0;
    } 
    else if (earningsFilter === 'month') {
      return logs
        .filter(l => isDateInMonth(l.date))
        .reduce((sum, l) => sum + l.total_earnings, 0);
    } 
    else if (earningsFilter === 'custom') {
      return logs
        .filter(l => isDateInRange(l.date, earningsCustomRange.start, earningsCustomRange.end))
        .reduce((sum, l) => sum + l.total_earnings, 0);
    }
    return 0;
  };

  // Calculate Displayed Austria Time based on Filter
  const getDisplayedAustriaTime = () => {
    // If filter is Today, just return the live timer
    if (austriaFilter === 'today') {
      return displayAustriaTime;
    }

    // Prepare list to sum
    let seconds = 0;
    
    // Historical logs (excluding today usually, depending on how DB stores it, 
    // but our API returns historical logs separately. 
    // NOTE: Our API returns ALL recent logs including today if saved. 
    // BUT today is live in `displayAustriaTime`. 
    // Strategy: Sum historical logs EXCLUDING today, then add `displayAustriaTime`.
    
    const todayStr = new Date().toISOString().split('T')[0];

    const historicalSum = austriaLogs
      .filter(log => {
        // Exclude today from history sum to avoid double counting if DB is updated
        if (log.date === todayStr) return false;

        if (austriaFilter === 'month') return isDateInMonth(log.date);
        if (austriaFilter === 'custom') return isDateInRange(log.date, austriaCustomRange.start, austriaCustomRange.end);
        return false;
      })
      .reduce((acc, curr) => acc + curr.total_seconds, 0);

    // Add today IF today falls in the range
    let addToday = false;
    if (austriaFilter === 'month') addToday = true; // Today is always in this month
    if (austriaFilter === 'custom') addToday = isDateInRange(todayStr, austriaCustomRange.start, austriaCustomRange.end);

    return historicalSum + (addToday ? displayAustriaTime : 0);
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 pb-20 lg:pb-0">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex-col shadow-2xl">
        <div className="h-24 flex items-center px-8 border-b border-slate-800">
           <div>
             <h1 className="text-2xl font-black tracking-tighter text-white">MASTNAK</h1>
             <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Driver Intelligence</p>
           </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="History" 
            active={currentView === 'history'} 
            onClick={() => setCurrentView('history')}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
          />
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {username.charAt(0).toUpperCase()}
             </div>
             <div>
                <p className="font-bold text-sm text-white">{username}</p>
                <p className="text-xs text-slate-400">Pro Driver</p>
             </div>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-3 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors w-full">
            <LogOut size={16} />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">M</div>
             <h2 className="text-lg lg:text-xl font-bold text-slate-800">
               {currentView === 'dashboard' ? 'Overview' : currentView === 'history' ? 'History' : 'Settings'}
             </h2>
          </div>
          
          <div className="flex items-center space-x-4">
             <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
               <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
             </button>
             <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <CalendarCheck size={16} className="text-indigo-500" />
                <span>{new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long' })}</span>
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-6 pb-24">
            
            {currentView === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* CONSOLIDATED EARNINGS CARD */}
                  <SmartCard 
                    title="Earnings" 
                    value={formatCurrency(getDisplayedEarnings())}
                    icon={<Wallet className="text-indigo-600" />}
                    filterType={earningsFilter}
                    onFilterChange={setEarningsFilter}
                    customRange={earningsCustomRange}
                    onCustomRangeChange={(s, e) => setEarningsCustomRange({ start: s, end: e })}
                    trend="Calculated based on logs"
                    trendUp={true}
                  />

                  {/* CONSOLIDATED AUSTRIA CARD */}
                  <SmartCard 
                    title="Time in Austria" 
                    value={formatDuration(getDisplayedAustriaTime())}
                    icon={<Clock className="text-rose-600" />}
                    filterType={austriaFilter}
                    onFilterChange={setAustriaFilter}
                    customRange={austriaCustomRange}
                    onCustomRangeChange={(s, e) => setAustriaCustomRange({ start: s, end: e })}
                    subtitle={austriaState.is_active ? "Tracking Currently Active" : "Tracking Paused"}
                  />

                  <StatCard 
                    title="Current Rate" 
                    value={`${formatCurrency(ratePerKm)}/km`} 
                    icon={<MapPin className="text-emerald-600" />}
                    subtitle="Configuration"
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column: Chart & Activity */}
                  <div className="xl:col-span-2 space-y-6">
                     <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                       <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                         <TrendingUp size={20} className="text-slate-400" />
                         Revenue Analytics
                       </h3>
                       <div className="h-[280px] w-full">
                         <RevenueChart data={logs} />
                       </div>
                     </div>
                  </div>

                  {/* Right Column: Controls */}
                  <div className="flex flex-col gap-6">
                    <AustriaControls 
                      isInsideAustria={austriaState.is_active}
                      timeInAustria={displayAustriaTime} // Keep this always "Today's live time" visually
                      onToggle={toggleAustria}
                    />

                    <DailyLog ratePerKm={ratePerKm} onSave={handleDailyLogSave} />
                  </div>
                </div>
              </>
            )}

            {currentView === 'history' && (
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Log</h3>
                  <RecentActivity logs={logs} />
               </div>
            )}

            {currentView === 'settings' && (
              <SettingsView ratePerKm={ratePerKm} setRatePerKm={updateSettings} />
            )}
          </div>
        </div>
      </main>
      
      <BottomNav currentView={currentView} onChangeView={setCurrentView} username={username} />
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
    ${active 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
  `}>
    {icon}
    <span>{label}</span>
  </button>
);

export default App;