import React, { useState } from 'react';
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
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const currentYear = new Date().getFullYear();

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Filter data by selected month
  const filteredData = data.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === selectedMonth && logDate.getFullYear() === currentYear;
  });

  // Format data for chart: sort by date ascending
  const chartData = [...filteredData]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      name: new Date(log.date).getDate().toString(), // Just the day number
      amount: log.total_earnings,
      fullDate: log.date
    }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-2 px-2">
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1"
        >
          {months.map((m, idx) => (
            <option key={idx} value={idx}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No data for {months[selectedMonth]}
          </div>
        ) : (
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
                tick={{ fill: '#64748b', fontSize: 10 }} 
                dy={10}
                interval={0} // Show all ticks if possible, or adjust logic
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
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
                labelFormatter={(label) => `${months[selectedMonth]} ${label}`}
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
        )}
      </div>
    </div>
  );
};
