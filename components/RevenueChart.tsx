import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

interface RevenueChartProps {
  data: any[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  // Format data for chart: sort by date ascending, take last 7
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map(log => ({
      name: new Date(log.date).toLocaleDateString('de-DE', { weekday: 'short' }),
      amount: log.total_earnings,
      fullDate: log.date
    }));

  if (chartData.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">Not enough data for chart</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12 }} 
        />
        <Tooltip 
          formatter={(value: number) => [formatCurrency(value), 'Earnings']}
          contentStyle={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
        />
        <Area 
          type="monotone" 
          dataKey="amount" 
          stroke="#0f172a" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorAmount)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
