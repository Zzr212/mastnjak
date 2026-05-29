import React, { useState, useEffect } from 'react';
import { Save, Calculator, Wallet, CheckCircle, Loader2, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface DailyLogData {
  start_km: number;
  end_km: number;
  wage: number;
  total_earnings: number;
  date?: string;
}

interface DailyLogProps {
  ratePerKm: number;
  initialStartKm?: string;
  editLogData?: any | null;
  onSave: (data: DailyLogData) => void;
}

export const DailyLog: React.FC<DailyLogProps> = ({ ratePerKm, initialStartKm = '', editLogData = null, onSave }) => {
  const [startKm, setStartKm] = useState<string>(initialStartKm);
  const [endKm, setEndKm] = useState<string>('');
  const [dailyWage, setDailyWage] = useState<string>('');
  const [withoutWage, setWithoutWage] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Update local state if prop changes and not touched yet or editing
  useEffect(() => {
    if (editLogData) {
      setStartKm(editLogData.start_km?.toString() || '');
      setEndKm(editLogData.end_km?.toString() || '');
      setDailyWage(editLogData.wage > 0 ? editLogData.wage.toString() : '');
      setWithoutWage(!editLogData.wage || editLogData.wage <= 0);
      setSelectedDate(editLogData.date || new Date().toISOString().split('T')[0]);
    } else if (initialStartKm && !startKm) {
      setStartKm(initialStartKm);
      setEndKm('');
      setDailyWage('');
      setWithoutWage(false);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialStartKm, editLogData]);
  
  // Date selection state
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Status state for the button
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const calculateEstimatedEarnings = () => {
    const start = parseFloat(startKm) || 0;
    const end = parseFloat(endKm) || 0;
    const wage = withoutWage ? 0 : (parseFloat(dailyWage) || 0);
    
    const dist = Math.max(0, end - start);
    return (dist * ratePerKm) + wage;
  };

  const handleSave = async () => {
    const total = calculateEstimatedEarnings();
    const start = parseFloat(startKm) || 0;
    const end = parseFloat(endKm) || 0;
    const wage = withoutWage ? 0 : (parseFloat(dailyWage) || 0);

    if (total > 0 || start > 0 || end > 0) {
      setStatus('saving');
      
      await onSave({
        id: editLogData?.id,
        start_km: start,
        end_km: end,
        wage: wage,
        total_earnings: total,
        date: selectedDate
      } as any);

      setStatus('success');
      
      // Clear form
      setStartKm('');
      setEndKm('');
      setDailyWage('');
      // Reset date to today
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowDatePicker(false);

      // Reset button after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Wallet size={20} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Daily Entry</h3>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`p-2 rounded-lg transition-colors ${showDatePicker || selectedDate !== new Date().toISOString().split('T')[0] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <Calendar size={18} />
          </button>
          
          {showDatePicker && (
            <div className="absolute right-0 top-full mt-2 bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-10 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {selectedDate !== new Date().toISOString().split('T')[0] && (
        <div className="mb-4 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <Calendar size={12} />
          Entry for: {new Date(selectedDate).toLocaleDateString()}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Start KM</label>
            <input 
              type="number" 
              value={startKm}
              onChange={(e) => setStartKm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">End KM</label>
            <input 
              type="number" 
              value={endKm}
              onChange={(e) => setEndKm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-500">Daily Wage / Dnevnica (€)</label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors">
              <input 
                type="checkbox" 
                checked={withoutWage}
                onChange={(e) => setWithoutWage(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Samo kilometri (bez dnevnice)
            </label>
          </div>
          <input 
            type="number" 
            value={dailyWage}
            onChange={(e) => setDailyWage(e.target.value)}
            disabled={withoutWage}
            className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${withoutWage ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="e.g. 50"
          />
        </div>

        <div className="pt-4 border-t border-slate-50 mt-2">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-500">Rate: {formatCurrency(ratePerKm)}/km</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(calculateEstimatedEarnings())}
            </span>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={status !== 'idle'}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium active:scale-95 ${
              status === 'success' 
                ? 'bg-emerald-500 text-white' 
                : status === 'saving'
                ? 'bg-slate-700 text-slate-200 cursor-wait'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {status === 'success' ? (
              <>
                <CheckCircle size={18} />
                Entry Saved!
              </>
            ) : status === 'saving' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};