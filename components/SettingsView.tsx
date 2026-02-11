import React from 'react';
import { Settings } from 'lucide-react';

interface SettingsViewProps {
  ratePerKm: number;
  setRatePerKm: (rate: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ ratePerKm, setRatePerKm }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <Settings className="text-slate-700" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
          <p className="text-slate-500 text-sm">Manage your preferences</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">Earnings Configuration</h3>
          <p className="text-sm text-slate-500">Configure how your mileage earnings are calculated.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rate per Kilometer (€)
            </label>
            <div className="flex items-center max-w-xs">
              <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 sm:text-sm font-medium">
                €
              </span>
              <input
                type="number"
                step="0.01"
                value={ratePerKm}
                onChange={(e) => setRatePerKm(parseFloat(e.target.value) || 0)}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none sm:text-sm text-slate-900 font-medium"
                placeholder="0.12"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              This value is multiplied by the difference between Start and End KM.
            </p>
          </div>

           <div className="pt-4 border-t border-slate-50">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Example Calculation</h4>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1 font-mono">
                <p>Start KM: 1000</p>
                <p>End KM:   1500 (Diff: 500km)</p>
                <p>Rate:     €{ratePerKm}</p>
                <p>-----------------</p>
                <p className="font-bold text-emerald-600">Earnings: €{(500 * ratePerKm).toFixed(2)} + Daily Wage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
