'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getAssetTypeColor, ASSET_TYPE_LABELS } from '@/lib/categories';
import type { AssetType } from '@/lib/types';

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
  data: { type: AssetType; value: number; percentage: number }[];
  total: number;
}

export function AllocationChart({ data, total }: Props) {
  const chartData = data.map(d => ({
    name: ASSET_TYPE_LABELS[d.type] || d.type,
    value: d.value,
    fill: getAssetTypeColor(d.type),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Allocation by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              cornerRadius={3}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number | undefined) => [`${fmt(value ?? 0)}\u20AC`, '']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground ml-1">{value}</span>
              )}
            />
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-foreground text-xl font-bold"
            >
              {fmt(total)}
            </text>
            <text
              x="50%"
              y="49%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[10px]"
            >
              total value
            </text>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
