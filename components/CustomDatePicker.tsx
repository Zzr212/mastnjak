import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  lang: Language;
  placeholder?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  lang, 
  placeholder,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Format YYYY-MM-DD keeping local timezone logic simple
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  // Generate Calendar Grid
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    // Adjust start day to Monday (1) based on EU standard, or keep Sunday (0)
    let startDay = getFirstDayOfMonth(year, month);
    // Optional: make Monday start of week (0=Mon, 6=Sun)
    // startDay = startDay === 0 ? 6 : startDay - 1; 

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = value && 
        new Date(value).getDate() === d && 
        new Date(value).getMonth() === month && 
        new Date(value).getFullYear() === year;

      const isToday = 
        new Date().getDate() === d &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      days.push(
        <button
          key={d}
          onClick={() => handleDayClick(d)}
          className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' 
              : isToday 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' 
                : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full min-w-[140px] transition-colors focus:ring-2 focus:ring-indigo-500/20 outline-none"
      >
        <Calendar size={16} className="text-indigo-500" />
        <span className="flex-1 text-left font-medium">
          {value ? new Date(value).toLocaleDateString(lang === 'en' ? 'en-US' : (lang === 'de' ? 'de-DE' : 'bs-BA')) : (placeholder || t.selectDate)}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
             <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={16} /></button>
             <span className="font-bold text-slate-800 text-sm">
                {t.months[viewDate.getMonth()]} {viewDate.getFullYear()}
             </span>
             <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={16} /></button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
             {['S','M','T','W','T','F','S'].map((d, i) => (
               <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
             ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 place-items-center">
             {renderCalendar()}
          </div>
          
          {value && (
            <button 
              type="button"
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="w-full mt-3 text-xs text-rose-500 hover:bg-rose-50 py-2 rounded-lg font-bold"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};