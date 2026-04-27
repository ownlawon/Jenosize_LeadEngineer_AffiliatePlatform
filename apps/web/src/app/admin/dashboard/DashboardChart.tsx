'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  data: Array<{ date: string; clicks: number }>;
}

export default function DashboardChart({ data }: Props) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            fontSize={11}
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fill: '#64748b' }}
          />
          <YAxis allowDecimals={false} fontSize={11} tick={{ fill: '#64748b' }} />
          <Tooltip />
          <Bar dataKey="clicks" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
