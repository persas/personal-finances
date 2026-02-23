'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import type { ResearchContent } from '@/lib/types';

const tooltipStyle = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  color: 'var(--foreground)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

interface Props {
  content: ResearchContent;
}

export function AnalystConsensus({ content }: Props) {
  const { analystData, metrics } = content;
  const hasTargets = analystData.targetMeanPrice != null;
  const hasTrend = analystData.recommendationTrend.length > 0;

  if (!hasTargets && !hasTrend) return null;

  const currentPrice = metrics.price ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Price Target Range */}
      {hasTargets && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analyst Price Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceTargetBar
              low={analystData.targetLowPrice!}
              mean={analystData.targetMeanPrice!}
              high={analystData.targetHighPrice!}
              current={currentPrice}
            />
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  ${analystData.targetLowPrice?.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mean</p>
                <p className="text-sm font-bold">
                  ${analystData.targetMeanPrice?.toFixed(0)}
                </p>
                {currentPrice > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {(((analystData.targetMeanPrice! - currentPrice) / currentPrice) * 100).toFixed(1)}% upside
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ${analystData.targetHighPrice?.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Trend */}
      {hasTrend && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recommendation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[...analystData.recommendationTrend].reverse().slice(0, 4).map(r => ({
                  period: new Date(r.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                  'Strong Buy': r.strongBuy,
                  Buy: r.buy,
                  Hold: r.hold,
                  Sell: r.sell,
                  'Strong Sell': r.strongSell,
                }))}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <XAxis
                  dataKey="period"
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--chart-tick)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-[10px] text-muted-foreground ml-0.5">{value}</span>
                  )}
                />
                <Bar dataKey="Strong Buy" stackId="a" fill="#059669" />
                <Bar dataKey="Buy" stackId="a" fill="#34d399" />
                <Bar dataKey="Hold" stackId="a" fill="#fbbf24" />
                <Bar dataKey="Sell" stackId="a" fill="#f87171" />
                <Bar dataKey="Strong Sell" stackId="a" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PriceTargetBar({
  low, mean, high, current,
}: {
  low: number; mean: number; high: number; current: number;
}) {
  const min = Math.min(low, current) * 0.95;
  const max = Math.max(high, current) * 1.05;
  const range = max - min;

  const pct = (v: number) => `${((v - min) / range) * 100}%`;

  return (
    <div className="relative h-10 mt-2">
      {/* Range bar */}
      <div
        className="absolute h-2 bg-muted rounded-full top-4"
        style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }}
      />
      {/* Mean marker */}
      <div
        className="absolute w-3 h-3 bg-primary rounded-full top-3.5 -translate-x-1/2 ring-2 ring-background"
        style={{ left: pct(mean) }}
      />
      {/* Current price marker */}
      <div
        className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
        style={{ left: pct(current) }}
      >
        <span className="text-[10px] font-mono font-bold">${current.toFixed(0)}</span>
        <div className="w-0.5 h-6 bg-foreground/50 mt-0.5" />
      </div>
    </div>
  );
}
