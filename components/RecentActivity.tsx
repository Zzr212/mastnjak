import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Wallet, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Edit2, 
  Check, 
  X,
  MapPin,
  Calendar,
  ListFilter,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDuration } from '../utils/formatters';
import { CustomDatePicker } from './CustomDatePicker';
import { Language } from '../utils/translations';

interface Log {
  id: number;
  date: string;
  start_km: number;
  end_km: number;
  wage: number;
  total_earnings: number;
}

interface AustriaSession {
  id: number;
  date: string;
  start_time: number;
  end_time: number;
  duration: number;
}

interface RecentActivityProps {
  logs: Log[];
  austriaSessions: AustriaSession[];
  onUpdateLog?: (log: Log) => void;
  onDeleteLog?: (id: number) => void;
  onDeleteAustriaSession?: (id: number) => void;
  lang?: Language; // Add language prop for datepicker
}

type TabType = 'earnings' | 'austria';

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs, austriaSessions, onUpdateLog, onDeleteLog, onDeleteAustriaSession, lang = 'en' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('earnings');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter State - Default EMPTY to show all
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Editing State (Earnings)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Log>>({});

  // --- Helpers ---

  const isDateInRange = (dateStr: string) => {
    if (!dateFrom && !dateTo) return true; // Show all if no filter
    const d = new Date(dateStr).getTime();
    const from = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
    const to = dateTo ? new Date(dateTo).getTime() : Infinity;
    return d >= from && d <= to;
  };

  // --- Filtering & Sorting Data ---

  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => isDateInRange(l.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, dateFrom, dateTo]);

  const filteredAustria = useMemo(() => {
    return austriaSessions
      .filter(s => isDateInRange(s.date))
      .sort((a, b) => b.start_time - a.start_time);
  }, [austriaSessions, dateFrom, dateTo]);

  const currentData = activeTab === 'earnings' ? filteredLogs : filteredAustria;

  // --- Summaries ---

  const totalEarningsSummary = useMemo(() => {
    return filteredLogs.reduce((sum, log) => sum + log.total_earnings, 0);
  }, [filteredLogs]);

  const totalAustriaTimeSummary = useMemo(() => {
    return filteredAustria.reduce((sum, s) => sum + s.duration, 0);
  }, [filteredAustria]);

  // --- Pagination ---

  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // --- Edit Handlers ---

  const startEdit = (log: Log) => {
    setEditingId(log.id);
    setEditForm({ ...log });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (onUpdateLog && editForm.id && editForm.start_km !== undefined && editForm.end_km !== undefined && editForm.wage !== undefined) {
      onUpdateLog({
        ...editForm as Log,
        total_earnings: 0 
      });
      setEditingId(null);
    }
  };

  // --- Render Row ---

  const renderDaySeparator = (currDate: string, prevDate: string | null) => {
    if (currDate !== prevDate) {
      return (
        <div className="flex items-center gap-4 py-4 mt-2">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {new Date(currDate).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'bs' ? 'bs-BA' : lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Controls & Summary Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => { setActiveTab('earnings'); setCurrentPage(1); }}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'earnings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Earnings
            </button>
            <button
              onClick={() => { setActiveTab('austria'); setCurrentPage(1); }}
              className={`flex-1 md:w-32 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'austria' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Austria Time
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
             <div className="w-32">
                <CustomDatePicker value={dateFrom} onChange={setDateFrom} lang={lang} />
             </div>
             <span className="text-slate-300">-</span>
             <div className="w-32">
                <CustomDatePicker value={dateTo} onChange={setDateTo} lang={lang} />
             </div>
          </div>
        </div>

        {/* Dynamic Summary based on Filter */}
        <div className="pt-4 border-t border-slate-100">
           {activeTab === 'earnings' ? (
             <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Total Earnings {dateFrom || dateTo ? '(Selected)' : '(All Time)'}</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(totalEarningsSummary)}</span>
             </div>
           ) : (
             <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Total Austria Time {dateFrom || dateTo ? '(Selected)' : '(All Time)'}</span>
                <span className="text-xl font-black text-slate-900">{formatDuration(totalAustriaTimeSummary)}</span>
             </div>
           )}
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[400px] flex flex-col">
        {paginatedData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
            <ListFilter size={48} className="mb-4 opacity-20" />
            <p>No records found.</p>
          </div>
        ) : (
          <div className="flex-1">
             {paginatedData.map((item, index) => {
               // Determine separation
               const prevItem = index > 0 ? paginatedData[index - 1] : null;
               const separator = renderDaySeparator(item.date, prevItem ? prevItem.date : null);

               if (activeTab === 'earnings') {
                 const log = item as Log;
                 const isEditing = editingId === log.id;
                 
                 return (
                   <div key={log.id}>
                     {separator}
                     <div className={`p-4 rounded-xl transition-all ${isEditing ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                        {isEditing ? (
                          // EDIT MODE
                          <div className="space-y-3">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-xs font-bold text-indigo-600 uppercase">Editing Entry</span>
                               <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                             </div>
                             <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] text-slate-500 font-bold">Start KM</label>
                                  <input 
                                    type="number" 
                                    value={editForm.start_km} 
                                    onChange={(e) => setEditForm({...editForm, start_km: parseFloat(e.target.value)})}
                                    className="w-full p-2 rounded border border-indigo-200 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 font-bold">End KM</label>
                                  <input 
                                    type="number" 
                                    value={editForm.end_km} 
                                    onChange={(e) => setEditForm({...editForm, end_km: parseFloat(e.target.value)})}
                                    className="w-full p-2 rounded border border-indigo-200 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-500 font-bold">Wage (€)</label>
                                  <input 
                                    type="number" 
                                    value={editForm.wage} 
                                    onChange={(e) => setEditForm({...editForm, wage: parseFloat(e.target.value)})}
                                    className="w-full p-2 rounded border border-indigo-200 text-sm"
                                  />
                                </div>
                             </div>
                             <button onClick={saveEdit} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                               <Check size={16} /> Save Changes
                             </button>
                          </div>
                        ) : (
                          // VIEW MODE
                          <div className="flex justify-between items-center group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                   <Wallet size={18} />
                                </div>
                                <div>
                                   <p className="font-bold text-slate-900 text-sm">
                                     Route: <span className="font-mono text-slate-600">{log.start_km} ➝ {log.end_km} km</span>
                                   </p>
                                   <p className="text-xs text-slate-400">
                                     Dist: {log.end_km - log.start_km} km • Wage: €{log.wage}
                                   </p>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <div className="font-black text-slate-900">{formatCurrency(log.total_earnings)}</div>
                               </div>
                               <div className="flex gap-1">
                                 <button 
                                   onClick={() => startEdit(log)}
                                   className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                 >
                                   <Edit2 size={16} />
                                 </button>
                                 <button 
                                   onClick={() => onDeleteLog && onDeleteLog(log.id)}
                                   className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                             </div>
                          </div>
                        )}
                     </div>
                   </div>
                 );
               } else {
                 const session = item as AustriaSession;
                 return (
                   <div key={session.id}>
                     {separator}
                     <div className="p-4 rounded-xl hover:bg-slate-50 border border-transparent flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                              <MapPin size={18} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                <Clock size={14} className="text-slate-400"/>
                                <span>
                                  {new Date(session.start_time).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} 
                                  {' - '}
                                  {new Date(session.end_time).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">Austria Entry Session</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="font-mono font-bold text-slate-900">{formatDuration(session.duration)}</div>
                           <button 
                             onClick={() => onDeleteAustriaSession && onDeleteAustriaSession(session.id)}
                             className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                     </div>
                   </div>
                 );
               }
             })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                p === 1 || 
                p === totalPages || 
                (p >= currentPage - 1 && p <= currentPage + 1)
              ) {
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === p 
                        ? 'bg-slate-900 text-white' 
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              } else if (
                (p === currentPage - 2 && p > 1) || 
                (p === currentPage + 2 && p < totalPages)
              ) {
                return <span key={p} className="text-slate-300 text-xs">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};