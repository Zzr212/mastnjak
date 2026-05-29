import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Edit3 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface CalendarViewProps {
  logs: any[];
  ratePerKm: number;
  onClose: () => void;
  onEditLog: (log: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, ratePerKm, onClose, onEditLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Adjust so Monday is first day of week
  const firstDayNormalized = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < firstDayNormalized; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const logForDay = logs.find(l => l.date === dStr);
    days.push({ day: i, dateStr: dStr, log: logForDay });
  }

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <CalendarIcon size={24} className="text-indigo-600" />
          Calendar
        </h2>
        <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 p-6 object-contain">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ChevronLeft size={24} /></button>
            <h3 className="text-lg font-bold text-slate-800">{monthName} {year}</h3>
            <button onClick={handleNextMonth} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ChevronRight size={24} /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((item, idx) => {
              if (!item) return <div key={idx} className="aspect-square"></div>;
              
              const hasWage = item.log && item.log.wage > 0;
              const hasKms = item.log && Math.max(0, item.log.end_km - item.log.start_km) > 0;
              const isSelected = selectedLog && selectedLog.date === item.dateStr;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedLog(item.log || { date: item.dateStr, isNew: true })}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative font-medium transition-all ${
                    isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  <span className="z-10">{item.day}</span>
                  {(hasWage || hasKms) && (
                    <div className="absolute bottom-1.5 flex gap-1">
                      {hasWage && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      {!hasWage && hasKms && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide UP Panel for Details */}
      <div className={`absolute bottom-0 left-0 w-full bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-[2.5rem] transition-transform duration-500 transform ${selectedLog ? 'translate-y-0' : 'translate-y-full'} p-8 max-h-[60vh] overflow-y-auto`}>
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">
               {selectedLog ? new Date(selectedLog.date).toLocaleDateString() : ''}
            </h3>
            <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-400 bg-slate-100 rounded-full hover:bg-slate-200">
               <X size={18} />
            </button>
         </div>

         {selectedLog && !selectedLog.isNew ? (
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kilometers</p>
                  <p className="text-2xl font-black text-slate-800">{Math.max(0, (selectedLog.end_km || 0) - (selectedLog.start_km || 0))} km</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wage / Dnevnica</p>
                  <p className="text-2xl font-black text-emerald-600">{selectedLog.wage > 0 ? formatCurrency(selectedLog.wage) : '—'}</p>
                </div>
              </div>
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Earnings</p>
                  <p className="text-xl font-bold text-indigo-900 break-words">{(Math.max(0, (selectedLog.end_km || 0) - (selectedLog.start_km || 0)) * ratePerKm).toFixed(2)} + {selectedLog.wage || 0}</p>
                </div>
                <p className="text-3xl font-black text-indigo-600">{formatCurrency(selectedLog.total_earnings)}</p>
              </div>

              <div className="pt-4 text-center">
                 <button 
                   onClick={() => onEditLog(selectedLog)}
                   className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white rounded-xl py-4 font-bold shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-sm mb-2"
                 >
                   <Edit3 size={18} /> Edit This Entry
                 </button>
              </div>
           </div>
         ) : (
           <div className="text-center py-10">
              <p className="text-slate-500 mb-6 font-medium">No record found for this date.</p>
              <button 
                 onClick={() => selectedLog && onEditLog(selectedLog)}
                 className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white rounded-xl py-4 font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all text-sm"
              >
                 <Edit3 size={18} /> Create Entry
              </button>
           </div>
         )}
      </div>

      {selectedLog && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm z-[-1]" onClick={() => setSelectedLog(null)} />
      )}
    </div>
  );
};
