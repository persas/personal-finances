'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCategoryColor } from '@/lib/categories';
import type { CategoryTotal } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CategoryDonut({ data }: { data: CategoryTotal[] }) {
  const chartData = data.slice(0, 10).map(d => ({
    name: d.category,
    value: d.total,
    fill: getCategoryColor(d.category),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}€`, '']}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
