'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { ResearchContent } from '@/lib/types';

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  color: 'var(--foreground)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

function fmtLarge(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

interface Props {
  content: ResearchContent;
}

export function FinancialCharts({ content }: Props) {
  const { chartData } = content;
  const hasRevenue = chartData.revenueHistory && chartData.revenueHistory.length > 0;
  const hasMargins = chartData.marginHistory && chartData.marginHistory.length > 0;
  const hasEarnings = chartData.earningsHistory && chartData.earningsHistory.length > 0;

  if (!hasRevenue && !hasMargins && !hasEarnings) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Revenue & Net Income */}
      {hasRevenue && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue & Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.revenueHistory!} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  tickFormatter={v => `$${fmtLarge(v)}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value?: number, name?: string) => [`$${fmtLarge(value ?? 0)}`, name ?? '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground ml-1">{value}</span>
                  )}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netIncome" name="Net Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Margin Trends */}
      {hasMargins && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margin Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData.marginHistory!.map(m => ({
                  ...m,
                  grossMargin: m.grossMargin != null ? +(m.grossMargin * 100).toFixed(1) : null,
                  operatingMargin: m.operatingMargin != null ? +(m.operatingMargin * 100).toFixed(1) : null,
                  netMargin: m.netMargin != null ? +(m.netMargin * 100).toFixed(1) : null,
                }))}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value?: number, name?: string) => [`${value ?? 0}%`, name ?? '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground ml-1">{value}</span>
                  )}
                />
                <Line type="monotone" dataKey="grossMargin" name="Gross" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="operatingMargin" name="Operating" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="netMargin" name="Net" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Earnings Surprises */}
      {hasEarnings && chartData.earningsHistory.length >= 4 && (
        <Card className={!hasRevenue || !hasMargins ? '' : 'lg:col-span-2'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Earnings History (EPS)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData.earningsHistory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="quarter"
                  tick={{ fill: 'var(--chart-tick)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  tickFormatter={v => `$${v}`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value?: number, name?: string) => [`$${value?.toFixed(2) ?? '—'}`, name ?? '']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground ml-1">{value}</span>
                  )}
                />
                <Bar dataKey="estimate" name="Estimate" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
