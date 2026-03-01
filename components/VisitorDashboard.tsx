import React from 'react';
import { User, Clock, TrendingUp, MapPin, X } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { getRole } from '../utils/roles';

interface VisitorDashboardProps {
  data: any;
  onClose: () => void;
}

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({ data, onClose }) => {
  const { user_info, settings, logs, austria_logs, austria } = data;
  const role = user_info ? getRole(user_info.created_at) : { label: 'Driver', color: 'text-slate-500', bg: 'bg-slate-100', icon: '🚛' };

  // Calculate totals
  const totalEarnings = logs.reduce((acc: number, log: any) => acc + (log.total_earnings || 0), 0);
  const totalAustriaSeconds = austria_logs.reduce((acc: number, log: any) => acc + (log.total_seconds || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header */}
      <div className="bg-slate-900 text-white pb-20 pt-8 px-6 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/50 to-slate-900/50 pointer-events-none"></div>
         
         <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg">
                  {user_info.profile_image ? (
                    <img src={user_info.profile_image} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-xl text-slate-400"><User /></div>
                  )}
               </div>
               <div>
                  <h1 className="text-2xl font-black tracking-tight">{user_info.username}</h1>
                  <div className={`inline-flex items-center gap-1 ${role.bg} ${role.color} bg-opacity-20 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10`}>
                     <span>{role.icon}</span> {role.label}
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
               <X size={20} />
            </button>
         </div>

         <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p>
               <p className="text-2xl font-black">{formatCurrency(totalEarnings)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Austria Time</p>
               <p className="text-2xl font-black">{formatDuration(totalAustriaSeconds)}</p>
            </div>
         </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-10 relative z-20 pb-10 space-y-6">
         
         {/* Chart */}
         <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-80">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2 text-slate-800">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TrendingUp size={18} /></div>
                  <h3 className="font-bold">Revenue Analytics</h3>
               </div>
            </div>
            <RevenueChart data={logs} />
         </div>

         {/* Recent Activity */}
         <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 mb-6">
               <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Clock size={18} /></div>
               <h3 className="font-bold">Recent Activity</h3>
            </div>
            <div className="space-y-4">
               {logs.slice(0, 5).map((log: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                       <p className="text-xs font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</p>
                       <p className="text-sm font-bold text-slate-800">{log.end_km - log.start_km} km driven</p>
                    </div>
                    <span className="text-emerald-600 font-black">{formatCurrency(log.total_earnings)}</span>
                 </div>
               ))}
               {logs.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No recent activity</p>}
            </div>
         </div>

         <div className="text-center">
            <p className="text-xs text-slate-400">Viewing as Visitor • Code expires {new Date(data.expires_at).toLocaleTimeString()}</p>
         </div>
      </div>
    </div>
  );
};
