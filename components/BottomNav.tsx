import React from 'react';
import { LayoutDashboard, Wallet, Settings, User, CheckCircle2 } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onChangeView: (view: 'dashboard' | 'history' | 'settings' | 'profile' | 'notes') => void;
  username: string;
  hasNotification?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, username, hasNotification }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { id: 'notes', icon: <CheckCircle2 size={20} />, label: 'Notes', hasDot: hasNotification },
    { id: 'history', icon: <Wallet size={20} />, label: 'History' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Config' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 py-2 lg:hidden z-40 flex justify-between items-center safe-area-pb shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChangeView(item.id as any)}
          className={`relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 min-w-[60px] ${
            currentView === item.id ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {item.hasDot && (
            <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-white"></span>
          )}
          <div className={`${currentView === item.id ? 'bg-indigo-50' : 'bg-transparent'} p-1.5 rounded-xl transition-colors`}>
            {item.icon}
          </div>
          <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
        </button>
      ))}
      
      {/* User Profile */}
      <button 
        onClick={() => onChangeView('profile')}
        className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 min-w-[60px] ${
            currentView === 'profile' ? 'opacity-100 scale-105' : 'opacity-80'
        }`}
      >
         <div className={`p-1.5 rounded-full border ${currentView === 'profile' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-400 border-slate-100'}`}>
            <User size={16} />
         </div>
         <span className={`text-[9px] font-bold max-w-[50px] truncate ${currentView === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>{username}</span>
      </button>
    </div>
  );
};