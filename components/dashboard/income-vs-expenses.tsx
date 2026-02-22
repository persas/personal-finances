'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}

export function IncomeVsExpenses({ totalIncome, totalExpenses, netSavings }: Props) {
  const data = [
    { name: 'Income', value: totalIncome, fill: '#22c55e' },
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
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}€`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}€`, '']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
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
