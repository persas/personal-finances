'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}€`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}€`, '']}
            />
            <Legend />
            <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
