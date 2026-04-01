import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AnalyticsChart({ data }) {
  // Threshold line in red
  const threshold = 0.1;

  return (
    <div className="analytics-wrapper" style={{ height: '220px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            hide 
          />
          <YAxis 
            domain={[0, 0.4]} 
            tick={{ fill: '#8b949e', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#161b22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#e6edf3' }}
            labelStyle={{ display: 'none' }}
          />
          <ReferenceLine y={threshold} stroke="#f43f5e" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorScore)"
            isAnimationActive={false} // Performance: disable for real-time
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
