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
  const pct = Math.min(item.percentUsed, 150); // cap visual at 150%
  const pace = item.expectedPace;

  // Determine the arc color based on status
  const arcColor =
    item.status === 'over_budget' ? '#ef4444'   // red
    : item.status === 'over_pace' ? '#f59e0b'   // amber
    : '#22c55e';                                  // green

  // The donut: spent portion + remaining portion
  // If over 100%, show full circle in the status color
  const spentAngle = Math.min(pct, 100);
  const remainAngle = Math.max(100 - spentAngle, 0);

  const pieData = [
    { name: 'Spent', value: spentAngle },
    { name: 'Remaining', value: remainAngle },
  ];

  // Overshoot arc (the red bit beyond 100%)
  const overshoot = pct > 100 ? Math.min(pct - 100, 50) : 0;
  const overshootData = overshoot > 0 ? [
    { name: 'Over', value: overshoot },
    { name: 'Rest', value: 100 - overshoot },
  ] : null;

  // Pace marker angle: 0 degrees = top, clockwise
  // Recharts Pie starts at 90° (3 o'clock). startAngle=90, endAngle=-270 goes clockwise from top.
  // So pace% maps to an angle.

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
              <Cell fill="#1e293b" />
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

            {/* Pace marker — thin arc at the expected position */}
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
              <Cell fill="#ffffff" opacity={0.5} />
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
      <p className="text-xs text-muted-foreground">{fmt(item.spentYTD)}€ / {fmt(item.annualBudget)}€</p>
      <p className={`text-xs font-semibold mt-0.5 ${
        item.status === 'over_budget' ? 'text-red-400'
        : item.status === 'over_pace' ? 'text-yellow-400'
        : 'text-green-400'
      }`}>
        {item.status === 'over_budget' ? 'Over budget'
        : item.status === 'over_pace' ? 'Over pace'
        : 'On track'}
      </p>
      <p className={`text-[10px] ${item.remainingBudget >= 0 ? 'text-muted-foreground' : 'text-red-400'}`}>
        {item.remainingBudget >= 0 ? `${fmt(item.remainingBudget)}€ left` : `${fmt(Math.abs(item.remainingBudget))}€ over`}
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
            Expected pace: {expectedPace.toFixed(0)}% · White marker = where you should be
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-6 py-2">
          {data.map(d => (
            <GaugeDonut key={d.group} item={d} />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            On track
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
            Over pace
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            Over budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-0.5 bg-white/50" />
            Expected pace
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
