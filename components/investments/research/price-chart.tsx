'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  color: 'var(--foreground)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

interface Props {
  priceHistory: Array<{ date: string; close: number }>;
}

export function PriceChart({ priceHistory }: Props) {
  if (priceHistory.length < 2) return null;

  // Calculate change
  const first = priceHistory[0].close;
  const last = priceHistory[priceHistory.length - 1].close;
  const change = ((last - first) / first) * 100;
  const isPositive = change >= 0;

  const color = isPositive ? '#10b981' : '#ef4444';

  // Format data for chart — show abbreviated dates
  const chartData = priceHistory.map(p => ({
    date: p.date,
    label: new Date(p.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    close: p.close,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Price History (12 months)</CardTitle>
          <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 8))}
            />
            <YAxis
              tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
              tickFormatter={v => `$${v}`}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value?: number) => [`$${(value ?? 0).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              fill="url(#priceGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
