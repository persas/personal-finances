'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  data: { month: number; income: number; expenses: number }[];
}

export function MonthlyTrend({ data }: Props) {
  const chartData = data
    .filter(d => d.income > 0 || d.expenses > 0)
    .map(d => ({
      name: MONTH_LABELS[d.month - 1],
      Income: d.income,
      Expenses: d.expenses,
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Monthly Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
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
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground ml-1">{value}</span>
              )}
            />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
