import React from 'react';
import { User, LogOut, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { Language, getTranslation } from '../utils/translations';

interface ProfileViewProps {
  username: string;
  ratePerKm: number;
  onLogout: () => void;
  onBack: () => void;
  lang: Language;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username, ratePerKm, onLogout, onBack, lang }) => {
  const t = (key: any) => getTranslation(lang, key);

  return (
    <div className="max-w-md mx-auto pt-4 px-4 pb-20 md:pb-0">
      
      {/* Main Container - Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-900/10 border border-white/50 overflow-hidden relative">
        
        {/* Decorative Header */}
        <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 relative">
           <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
           <button 
             onClick={onBack}
             className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur transition-all"
           >
             Close
           </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-8 -mt-16 relative">
           {/* Avatar */}
           <div className="flex justify-center mb-4">
              <div className="w-32 h-32 rounded-[2rem] bg-white p-2 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                 <div className="w-full h-full bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-500">
                    <User size={48} />
                 </div>
              </div>
           </div>

           <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{username}</h2>
              <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold mt-2 border border-indigo-100">
                 <ShieldCheck size={12} />
                 <span>PRO DRIVER</span>
              </div>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{t('currentRate')}</p>
                 <p className="text-xl font-black text-slate-900">{formatCurrency(ratePerKm)}</p>
              </div>
              <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-100 text-center">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Status</p>
                 <p className="text-xl font-black text-emerald-600 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active
                 </p>
              </div>
           </div>

           {/* Logout Button */}
           <button 
             onClick={onLogout}
             className="w-full py-5 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 active:scale-95 transition-all"
           >
             <LogOut size={20} />
             {t('logout')}
           </button>

           <div className="mt-8 text-center opacity-40">
              <p className="text-[10px] uppercase tracking-widest font-semibold">{t('poweredBy')}</p>
           </div>
        </div>
      </div>
    </div>
  );
};