'use client';

import { Card, CardContent } from '@/components/ui/card';

interface Props {
  label: string;
  value: string;
  health?: 'good' | 'neutral' | 'bad' | null;
  subtitle?: string;
}

const healthColors = {
  good: 'bg-emerald-500',
  neutral: 'bg-amber-500',
  bad: 'bg-red-500',
};

export function MetricCard({ label, value, health, subtitle }: Props) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2">
          {health && (
            <span className={`h-2 w-2 rounded-full shrink-0 ${healthColors[health]}`} />
          )}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
            {label}
          </p>
        </div>
        <p className="text-lg font-bold tracking-tight mt-1">{value}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Utility: evaluate metric health based on thresholds
export function evaluateHealth(
  value: number | null,
  thresholds: { good: [number, number]; neutral: [number, number] },
): 'good' | 'neutral' | 'bad' | null {
  if (value == null) return null;
  if (value >= thresholds.good[0] && value <= thresholds.good[1]) return 'good';
  if (value >= thresholds.neutral[0] && value <= thresholds.neutral[1]) return 'neutral';
  return 'bad';
}
