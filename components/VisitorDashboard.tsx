import React, { useState, useEffect } from 'react';
import { User, Clock, TrendingUp, MapPin, X } from 'lucide-react';
import { RevenueChart } from './RevenueChart';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { getRole } from '../utils/roles';

interface VisitorDashboardProps {
  data: any;
  onClose: () => void;
}

export const VisitorDashboard: React.FC<VisitorDashboardProps> = ({ data, onClose }) => {
  const { user_info, settings, logs } = data;
  const role = user_info ? getRole(user_info.created_at) : { label: 'Driver', color: 'text-slate-500', bg: 'bg-slate-100', icon: '🚛' };

  // Month State
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  const currentYear = new Date().getFullYear();
  
  // Filter logs by month
  const monthLogs = logs.filter((log: any) => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === selectedMonth && logDate.getFullYear() === currentYear;
  });

  const monthEarnings = monthLogs.reduce((acc: number, log: any) => acc + (log.total_earnings || 0), 0);
  const monthKm = monthLogs.reduce((acc: number, log: any) => acc + Math.max(0, (log.end_km || 0) - (log.start_km || 0)), 0);
  const monthWages = monthLogs.filter((log: any) => (log.wage || 0) > 0).length;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = months[selectedMonth];

  // Pagination
  const sortedMonthLogs = [...monthLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPages = Math.ceil(sortedMonthLogs.length / itemsPerPage);
  const paginatedLogs = sortedMonthLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

         <div className="relative z-10 grid grid-cols-1 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{monthName} Overview</p>
               <div className="flex flex-col gap-2">
                 <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(monthEarnings)}</p>
                 <div className="flex items-center gap-3 text-xs font-medium text-slate-300 mt-1">
                   <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                     <span className="text-white font-bold">{monthKm}</span> km
                   </div>
                   <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                     <span className="text-white font-bold">{monthWages}</span> dnevnica
                   </div>
                 </div>
               </div>
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
            <RevenueChart data={logs} month={selectedMonth} onMonthChange={setSelectedMonth} />
         </div>

         {/* Recent Activity */}
         <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 mb-6">
               <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Clock size={18} /></div>
               <h3 className="font-bold">Recent Activity</h3>
            </div>
            <div className="space-y-4">
               {paginatedLogs.map((log: any, i: number) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                       <p className="text-xs font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</p>
                       <p className="text-sm font-bold text-slate-800">{log.end_km - log.start_km} km driven</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                       <p className="text-emerald-600 font-black">{formatCurrency(log.total_earnings)}</p>
                       {(log.wage || 0) > 0 && <p className="text-[10px] text-slate-400 font-bold uppercase bg-slate-200/50 px-1.5 py-0.5 rounded">1 dnevnica</p>}
                    </div>
                 </div>
               ))}
               {sortedMonthLogs.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No recent activity for {monthName}</p>}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
         </div>

         <div className="text-center">
            <p className="text-xs text-slate-400">Viewing as Visitor • Code expires {new Date(data.expires_at).toLocaleTimeString()}</p>
         </div>
      </div>
    </div>
  );
};
