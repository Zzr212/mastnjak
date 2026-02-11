import React, { useState, useEffect } from 'react';
import { Save, Calculator, Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface DailyLogData {
  start_km: number;
  end_km: number;
  wage: number;
  total_earnings: number;
}

interface DailyLogProps {
  ratePerKm: number;
  onSave: (data: DailyLogData) => void;
}

export const DailyLog: React.FC<DailyLogProps> = ({ ratePerKm, onSave }) => {
  const [startKm, setStartKm] = useState<string>('');
  const [endKm, setEndKm] = useState<string>('');
  const [dailyWage, setDailyWage] = useState<string>('');
  
  // Status state for the button
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const calculateEstimatedEarnings = () => {
    const start = parseFloat(startKm) || 0;
    const end = parseFloat(endKm) || 0;
    const wage = parseFloat(dailyWage) || 0;
    
    const dist = Math.max(0, end - start);
    return (dist * ratePerKm) + wage;
  };

  const handleSave = async () => {
    const total = calculateEstimatedEarnings();
    const start = parseFloat(startKm) || 0;
    const end = parseFloat(endKm) || 0;
    const wage = parseFloat(dailyWage) || 0;

    if (total > 0) {
      setStatus('saving');
      
      // Simulate API call delay for effect or wait for real implementation via onSave promise
      await onSave({
        start_km: start,
        end_km: end,
        wage: wage,
        total_earnings: total
      });

      setStatus('success');
      
      // Clear form
      setStartKm('');
      setEndKm('');
      setDailyWage('');

      // Reset button after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-900 text-white rounded-lg">
          <Wallet size={20} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Daily Entry</h3>
      </div>

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
          <label className="block text-xs font-medium text-slate-500 mb-1">Daily Wage / Dnevnica (€)</label>
          <input 
            type="number" 
            value={dailyWage}
            onChange={(e) => setDailyWage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
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