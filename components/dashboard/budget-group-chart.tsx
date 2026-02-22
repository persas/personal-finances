'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getBudgetGroupColor } from '@/lib/categories';
import type { BudgetGroupYearlySummary } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface Props {
  data: BudgetGroupYearlySummary[];
}

function GaugeDonut({ item }: { item: BudgetGroupYearlySummary }) {
  const groupColor = getBudgetGroupColor(item.group);
  const pct = Math.min(item.percentUsed, 150);
  const pace = item.expectedPace;

  const arcColor =
    item.status === 'over_budget' ? '#ef4444'
    : item.status === 'over_pace' ? '#f59e0b'
    : '#10b981';

  const spentAngle = Math.min(pct, 100);
  const remainAngle = Math.max(100 - spentAngle, 0);

  const pieData = [
    { name: 'Spent', value: spentAngle },
    { name: 'Remaining', value: remainAngle },
  ];

  const overshoot = pct > 100 ? Math.min(pct - 100, 50) : 0;
  const overshootData = overshoot > 0 ? [
    { name: 'Over', value: overshoot },
    { name: 'Rest', value: 100 - overshoot },
  ] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background track */}
            <Pie
              data={[{ value: 100 }]}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={56}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="var(--chart-track)" />
            </Pie>

            {/* Main spent arc */}
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={56}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={arcColor} />
              <Cell fill="transparent" />
            </Pie>

            {/* Overshoot arc (outer ring, red) */}
            {overshootData && (
              <Pie
                data={overshootData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={65}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#ef4444" opacity={0.7} />
                <Cell fill="transparent" />
              </Pie>
            )}

            {/* Pace marker */}
            <Pie
              data={[
                { value: Math.max(pace - 1, 0) },
                { value: 2 },
                { value: Math.max(100 - pace - 1, 0) },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={66}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill="transparent" />
              <Cell fill="var(--foreground)" opacity={0.3} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color: arcColor }}>
            {item.percentUsed.toFixed(0)}%
          </span>
          <span className="text-[10px] text-muted-foreground">of annual</span>
        </div>
      </div>

      {/* Label below */}
      <p className="mt-2 text-sm font-semibold truncate max-w-[130px] text-center" style={{ color: groupColor }}>
        {item.group}
      </p>
      <p className="text-xs text-muted-foreground">{fmt(item.spentYTD)}&euro; / {fmt(item.annualBudget)}&euro;</p>
      <p className={`text-xs font-semibold mt-0.5 ${
        item.status === 'over_budget' ? 'text-red-600 dark:text-red-400'
        : item.status === 'over_pace' ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400'
      }`}>
        {item.status === 'over_budget' ? 'Over budget'
        : item.status === 'over_pace' ? 'Over pace'
        : 'On track'}
      </p>
      <p className={`text-[10px] ${item.remainingBudget >= 0 ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400'}`}>
        {item.remainingBudget >= 0 ? `${fmt(item.remainingBudget)}\u20AC left` : `${fmt(Math.abs(item.remainingBudget))}\u20AC over`}
      </p>
    </div>
  );
}

export function BudgetGroupChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const expectedPace = data[0]?.expectedPace ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Budget Group Overview
          <span className="text-xs font-normal text-muted-foreground">
            Expected pace: {expectedPace.toFixed(0)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-8 py-2">
          {data.map(d => (
            <GaugeDonut key={d.group} item={d} />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            On track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
            Over pace
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            Over budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-0.5 rounded bg-foreground/30" />
            Expected pace
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
