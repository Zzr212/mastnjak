import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend, 
  trendUp 
}) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-slate-500">{title}</h4>
        <div className="p-2 bg-slate-50 rounded-lg">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`text-xs mt-2 font-medium flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};
