'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

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

interface Props {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}

export function IncomeVsExpenses({ totalIncome, totalExpenses, netSavings }: Props) {
  const data = [
    { name: 'Income', value: totalIncome, fill: '#10b981' },
    { name: 'Expenses', value: totalExpenses, fill: '#ef4444' },
    { name: 'Savings', value: Math.max(netSavings, 0), fill: '#3b82f6' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              tickFormatter={v => `${v}\u20AC`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}\u20AC`, '']}
              cursor={{ fill: 'var(--chart-grid)', opacity: 0.5 }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={56}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
