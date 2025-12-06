import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Email } from '../types';

interface StatsProps {
  emails: Email[];
}

export const Stats: React.FC<StatsProps> = ({ emails }) => {
  const data = [
    { name: 'Promotions', value: emails.filter(e => e.category === 'promotions').length, color: '#60A5FA' }, // blue-400
    { name: 'Updates', value: emails.filter(e => e.category === 'updates').length, color: '#FBBF24' },    // amber-400
    { name: 'Social', value: emails.filter(e => e.category === 'social').length, color: '#34D399' },     // emerald-400
    { name: 'Primary', value: emails.filter(e => e.category === 'primary').length, color: '#818CF8' },    // indigo-400
  ].filter(d => d.value > 0);

  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Inbox Composition</h3>
      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={35}
              outerRadius={50}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-xl font-bold text-gray-700">{emails.length}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600 font-medium">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};