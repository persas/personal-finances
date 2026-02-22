'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { getCategoryColor } from '@/lib/categories';
import type { CategoryTotal } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  color: 'var(--foreground)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

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
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              tickFormatter={v => `${v}\u20AC`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}\u20AC`, '']}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === String(label));
                return item?.fullName || String(label);
              }}
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.5 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
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
