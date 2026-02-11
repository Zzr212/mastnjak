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
  Clock
} from 'lucide-react';
import { StatCard } from './components/StatCard';
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
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [ratePerKm, setRatePerKm] = useState(0.12);
  const [logs, setLogs] = useState<any[]>([]);
  const [austriaState, setAustriaState] = useState({
    total_seconds: 0,
    is_active: false,
    last_start_timestamp: null as number | null
  });

  // Client-side timer for visual feedback
  const [displayAustriaTime, setDisplayAustriaTime] = useState(0);

  // Auth Handler
  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
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
      setAustriaState(data.austria);
      
      // Calculate initial display time
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
    } catch (err) {
      console.error(err);
    }
  };

  // Enhanced Save Handler to pass to DailyLog
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

  // Calculations
  const earningsToday = logs.find(l => l.date === new Date().toISOString().split('T')[0])?.total_earnings || 0;
  const earningsMonth = logs.reduce((acc, curr) => acc + curr.total_earnings, 0); // Simplified for "All Time" essentially in this demo

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 pb-16 lg:pb-0">
      
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex-col">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="w-8 h-8 bg-slate-900 rounded-lg mr-3 flex items-center justify-center shadow-lg shadow-slate-200">
            <span className="text-white font-bold text-sm">DD</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">Dashboard Driver</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
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

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-50 w-full transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:ml-64">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-10 shrink-0 sticky top-0 z-20">
          <h2 className="text-lg lg:text-xl font-bold text-slate-800">
            {currentView === 'dashboard' ? 'Overview' : currentView === 'history' ? 'History' : 'Settings'}
          </h2>
          
          <div className="flex items-center space-x-4">
             <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
               <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
             </button>
             <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <CalendarCheck size={16} />
                <span>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
             </div>
             <div className="lg:hidden text-xs font-bold bg-slate-100 px-2 py-1 rounded">
               {token ? 'Pro Driver' : 'Guest'}
             </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-6 pb-20">
            
            {currentView === 'dashboard' && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard 
                    title="Earnings Today" 
                    value={formatCurrency(earningsToday)} 
                    icon={<Wallet className="text-emerald-500" />}
                    trend="Based on daily entry"
                    trendUp={true}
                  />
                  <StatCard 
                    title="Austria Time" 
                    value={formatDuration(displayAustriaTime)} 
                    icon={<Clock className="text-red-500" />}
                    subtitle={austriaState.is_active ? "Tracking Active" : "Paused"}
                  />
                  <StatCard 
                    title="Total Earnings" 
                    value={formatCurrency(earningsMonth)} 
                    icon={<TrendingUp className="text-indigo-500" />}
                    trend="Last 30 days"
                    trendUp={true}
                  />
                  <StatCard 
                    title="Current Rate" 
                    value={`${formatCurrency(ratePerKm)}/km`} 
                    icon={<MapPin className="text-violet-500" />}
                    subtitle="Edit in Settings"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Analytics</h3>
                    <div className="h-[250px] lg:h-[320px] w-full">
                      <RevenueChart data={logs} />
                    </div>
                  </div>

                  {/* Right Column Controls */}
                  <div className="flex flex-col gap-6">
                    <AustriaControls 
                      isInsideAustria={austriaState.is_active}
                      timeInAustria={displayAustriaTime}
                      onToggle={toggleAustria}
                    />

                    <DailyLog ratePerKm={ratePerKm} onSave={handleDailyLogSave} />
                  </div>
                </div>
              </>
            )}

            {currentView === 'history' && (
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Activity Log</h3>
                  <RecentActivity logs={logs} />
               </div>
            )}

            {currentView === 'settings' && (
              <SettingsView ratePerKm={ratePerKm} setRatePerKm={updateSettings} />
            )}
          </div>
        </div>
      </main>
      
      <BottomNav currentView={currentView} onChangeView={setCurrentView} />
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`
    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1
    ${active 
      ? 'bg-slate-900 text-white shadow-md shadow-slate-200' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
  `}>
    {icon}
    <span>{label}</span>
  </button>
);

export default App;