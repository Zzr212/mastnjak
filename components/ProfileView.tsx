import React from 'react';
import { User, LogOut, ShieldCheck, MapPin } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface ProfileViewProps {
  username: string;
  ratePerKm: number;
  onLogout: () => void;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username, ratePerKm, onLogout, onBack }) => {
  return (
    <div className="max-w-md mx-auto pt-10 px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative">
        {/* Header Background */}
        <div className="h-32 bg-slate-900 relative">
           <div className="absolute top-0 left-0 w-full h-full opacity-20">
               <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
           </div>
           <button 
             onClick={onBack}
             className="absolute top-4 right-4 text-white/50 hover:text-white text-sm font-bold"
           >
             Close
           </button>
        </div>

        {/* Avatar & Info */}
        <div className="relative px-6 pb-8">
           <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                 <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <User size={40} />
                 </div>
              </div>
           </div>

           <div className="mt-14 mb-6">
              <h2 className="text-2xl font-black text-slate-900">{username}</h2>
              <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mt-1">
                 <ShieldCheck size={16} />
                 <span>Verified Professional Driver</span>
              </div>
           </div>

           {/* Stats / Info */}
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Current Rate</p>
                 <p className="text-lg font-bold text-slate-900">{formatCurrency(ratePerKm)}/km</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status</p>
                 <p className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Active
                 </p>
              </div>
           </div>

           {/* Logout Button */}
           <button 
             onClick={onLogout}
             className="w-full py-4 bg-rose-50 text-rose-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
           >
             <LogOut size={20} />
             Sign Out
           </button>

           <div className="mt-6 text-center">
              <p className="text-[10px] text-slate-300 uppercase tracking-widest">Mastnak Driver Intelligence v1.2</p>
           </div>
        </div>
      </div>
    </div>
  );
};