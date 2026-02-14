import React, { useState } from 'react';
import { ChevronDown, Calendar, X } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';
import { Language } from '../utils/translations';

export type FilterType = 'today' | 'month' | 'custom';

interface SmartCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  filterType: FilterType;
  onFilterChange: (type: FilterType) => void;
  customRange?: { start: string; end: string };
  onCustomRangeChange?: (start: string, end: string) => void;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}

export const SmartCard: React.FC<SmartCardProps> = ({ 
  title, 
  value, 
  icon, 
  filterType,
  onFilterChange,
  customRange,
  onCustomRangeChange,
  subtitle,
  trend,
  trendUp
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  // Default to 'en' since SmartCard doesn't receive lang explicitly, 
  // but simpler than drilling props down just for this modal. 
  // Ideally should be passed in.
  const lang: Language = 'en'; 

  const handleTypeSelect = (type: FilterType) => {
    if (type === 'custom') {
      setShowCustomPicker(true);
    } else {
      onFilterChange(type);
      setShowCustomPicker(false);
    }
    setIsDropdownOpen(false);
  };

  const getFilterLabel = () => {
    switch(filterType) {
      case 'today': return 'Today';
      case 'month': return 'This Month';
      case 'custom': return 'Custom';
      default: return 'Filter';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 relative">
      {/* Header with Filter */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md mt-1 hover:bg-slate-100 transition-colors w-fit"
          >
            {getFilterLabel()}
            <ChevronDown size={12} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-14 left-6 z-20 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <button onClick={() => handleTypeSelect('today')} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 ${filterType === 'today' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                Today
              </button>
              <button onClick={() => handleTypeSelect('month')} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 ${filterType === 'month' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                This Month
              </button>
              <button onClick={() => handleTypeSelect('custom')} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 ${filterType === 'custom' ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                Custom Range
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl shadow-inner">
          {icon}
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
      </div>

      {/* Footer / Info */}
      <div className="flex items-center justify-between mt-auto">
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
        {trend && (
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend}
          </div>
        )}
      </div>

      {/* Custom Date Picker Modal / Overlay */}
      {showCustomPicker && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
          <button 
            onClick={() => setShowCustomPicker(false)} 
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
          <h5 className="text-sm font-bold text-slate-800 mb-3">Select Dates</h5>
          <div className="space-y-2 w-full">
            <CustomDatePicker 
                value={customRange?.start || ''}
                onChange={(v) => onCustomRangeChange && onCustomRangeChange(v, customRange?.end || '')}
                lang={lang}
                className="w-full"
            />
            <span className="text-xs text-slate-400">to</span>
            <CustomDatePicker 
                value={customRange?.end || ''}
                onChange={(v) => onCustomRangeChange && onCustomRangeChange(customRange?.start || '', v)}
                lang={lang}
                className="w-full"
            />
          </div>
          <button 
            onClick={() => {
              onFilterChange('custom');
              setShowCustomPicker(false);
            }}
            className="mt-3 w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};