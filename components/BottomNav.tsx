import React from 'react';
import { LayoutDashboard, Clock, Settings, Wallet } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onChangeView: (view: 'dashboard' | 'history' | 'settings') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { id: 'history', icon: <Wallet size={20} />, label: 'History' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 lg:hidden z-40 flex justify-between items-center safe-area-pb">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onChangeView(item.id as any)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            currentView === item.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`${currentView === item.id ? 'bg-slate-100' : ''} p-1.5 rounded-lg`}>
            {item.icon}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
