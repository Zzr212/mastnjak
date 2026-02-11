import React from 'react';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface Log {
  id: number;
  date: string;
  start_km: number;
  end_km: number;
  total_earnings: number;
}

interface RecentActivityProps {
  logs: Log[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs }) => {
  if (logs.length === 0) {
    return <div className="p-4 text-center text-slate-400 text-sm">No recent activity recorded.</div>;
  }

  return (
    <div className="flex flex-col gap-0 divide-y divide-slate-50">
      {logs.map((log) => (
        <div key={log.id} className="py-3 flex items-center justify-between group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
          <div className="flex items-start gap-3 overflow-hidden">
            <div className="mt-1 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <CalendarCheck size={14} className="text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <span>{new Date(log.date).toLocaleDateString('de-DE')}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {log.end_km - log.start_km} km driven
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-2">
            <div className="text-sm font-bold text-slate-900">{formatCurrency(log.total_earnings)}</div>
            <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
              Saved
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
