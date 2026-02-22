'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { getCategoryColor } from '@/lib/categories';
import type { CategoryTotal } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SpendingBar({ data }: { data: CategoryTotal[] }) {
  const chartData = data.slice(0, 10).map(d => ({
    name: d.category.length > 18 ? d.category.slice(0, 16) + '...' : d.category,
    fullName: d.category,
    value: d.total,
    fill: getCategoryColor(d.category),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={v => `${v}€`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}€`, '']}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === String(label));
                return item?.fullName || String(label);
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
