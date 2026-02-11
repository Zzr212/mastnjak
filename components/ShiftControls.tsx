import React from 'react';
import { PlayCircle, PauseCircle, StopCircle, Coffee } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

type ShiftStatus = 'offline' | 'online' | 'break';

interface ShiftControlsProps {
  status: ShiftStatus;
  elapsedTime: number;
  onStatusChange: (status: ShiftStatus) => void;
}

export const ShiftControls: React.FC<ShiftControlsProps> = ({ 
  status, 
  elapsedTime,
  onStatusChange 
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="text-center mb-6">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Current Session</h3>
        <div className="text-4xl font-mono font-bold text-slate-900 tracking-tight">
          {formatDuration(elapsedTime)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {status === 'offline' ? (
          <button
            onClick={() => onStatusChange('online')}
            className="col-span-2 flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-md shadow-slate-200"
          >
            <PlayCircle size={24} />
            <span className="font-semibold">Start Shift</span>
          </button>
        ) : (
          <>
            {status === 'online' ? (
              <button
                onClick={() => onStatusChange('break')}
                className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 p-4 rounded-xl hover:bg-amber-100 transition-all"
              >
                <Coffee size={20} />
                <span className="font-medium">Take Break</span>
              </button>
            ) : (
              <button
                onClick={() => onStatusChange('online')}
                className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl hover:bg-emerald-100 transition-all"
              >
                <PlayCircle size={20} />
                <span className="font-medium">Resume</span>
              </button>
            )}

            <button
              onClick={() => onStatusChange('offline')}
              className="flex items-center justify-center gap-2 bg-white text-rose-600 border border-rose-100 p-4 rounded-xl hover:bg-rose-50 transition-all"
            >
              <StopCircle size={20} />
              <span className="font-medium">End Shift</span>
            </button>
          </>
        )}
      </div>
      
      {status === 'online' && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400 animate-pulse">
            GPS Tracking Active • Calculating Earnings
          </p>
        </div>
      )}
    </div>
  );
};
