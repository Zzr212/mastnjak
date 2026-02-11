import React from 'react';
import { LayoutDashboard, Wallet, Settings, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onChangeView: (view: 'dashboard' | 'history' | 'settings' | 'profile') => void;
  username: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, username }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { id: 'history', icon: <Wallet size={20} />, label: 'History' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-6 py-2 lg:hidden z-40 flex justify-between items-center safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChangeView(item.id as any)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
            currentView === item.id ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`${currentView === item.id ? 'bg-slate-100' : 'bg-transparent'} p-1.5 rounded-lg transition-colors`}>
            {item.icon}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
      
      {/* User Profile Item - Now Clickable */}
      <button 
        onClick={() => onChangeView('profile')}
        className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${
            currentView === 'profile' ? 'opacity-100 scale-105' : 'opacity-80'
        }`}
      >
         <div className={`p-1.5 rounded-full border ${currentView === 'profile' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
            <User size={16} />
         </div>
         <span className={`text-[9px] font-bold max-w-[50px] truncate ${currentView === 'profile' ? 'text-indigo-600' : 'text-slate-400'}`}>{username}</span>
      </button>
    </div>
  );
};