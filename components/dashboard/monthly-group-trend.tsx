'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { getBudgetGroupColor, BUDGET_GROUPS } from '@/lib/categories';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  data: Array<{ month: number; [key: string]: number }>;
}

export function MonthlyGroupTrend({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Filter to months with any spending
  const chartData = data
    .filter(d => {
      const total = BUDGET_GROUPS.reduce((sum, g) => sum + (d[g] || 0), 0);
      return total > 0;
    })
    .map(d => ({
      name: MONTH_LABELS[d.month - 1],
      ...BUDGET_GROUPS.reduce((acc, g) => ({ ...acc, [g]: Math.round((d[g] || 0) * 100) / 100 }), {} as Record<string, number>),
    }));

  if (chartData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Monthly Spending by Budget Group</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${fmt(v)}€`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number | undefined, name: string | undefined) => [`${fmt(value ?? 0)}€`, name ?? '']}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
            {[...BUDGET_GROUPS].reverse().map(group => (
              <Area
                key={group}
                type="monotone"
                dataKey={group}
                stackId="1"
                fill={getBudgetGroupColor(group)}
                stroke={getBudgetGroupColor(group)}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
