import React from 'react';
import { PlayCircle, StopCircle, MapPin } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface AustriaControlsProps {
  isInsideAustria: boolean;
  timeInAustria: number;
  onToggle: () => void;
}

export const AustriaControls: React.FC<AustriaControlsProps> = ({ 
  isInsideAustria, 
  timeInAustria,
  onToggle 
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-colors duration-500 ${isInsideAustria ? 'text-red-600' : 'text-slate-400'}`}>
        <MapPin size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Austria Timer</h3>
          <div className={`px-2 py-1 rounded text-xs font-bold border ${isInsideAustria ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {isInsideAustria ? 'INSIDE AUSTRIA' : 'OUTSIDE'}
          </div>
        </div>

        <div className="text-center mb-6 py-4">
          <div className="text-5xl font-mono font-bold text-slate-900 tracking-tight">
            {formatDuration(timeInAustria)}
          </div>
          <p className="text-xs text-slate-400 mt-2">Total time in Austria today</p>
        </div>

        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl transition-all shadow-md active:scale-95 ${
            isInsideAustria 
              ? 'bg-white text-red-600 border-2 border-red-100 hover:bg-red-50' 
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
          }`}
        >
          {isInsideAustria ? (
            <>
              <StopCircle size={24} />
              <span className="font-bold">Exit Austria</span>
            </>
          ) : (
            <>
              <PlayCircle size={24} />
              <span className="font-bold">Enter Austria</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
