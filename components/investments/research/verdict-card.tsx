'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

const recommendationColors: Record<string, string> = {
  'Strong Buy': 'bg-emerald-600 text-white',
  'Buy': 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  'Hold': 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  'Sell': 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
  'Strong Sell': 'bg-red-600 text-white',
};

const confidenceColors: Record<string, string> = {
  high: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-slate-500',
};

export function VerdictCard({ content }: Props) {
  const { verdict } = content;

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
        style={{
          backgroundColor:
            verdict.recommendation.includes('Buy') ? '#10b981'
            : verdict.recommendation.includes('Sell') ? '#ef4444'
            : '#f59e0b',
        }}
      />
      <CardContent className="py-5 pl-7">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <Badge
                className={`text-sm font-bold px-3 py-1 ${recommendationColors[verdict.recommendation] || recommendationColors['Hold']}`}
              >
                {verdict.recommendation}
              </Badge>
              <span className={`text-xs font-medium ${confidenceColors[verdict.confidenceLevel] || ''}`}>
                {verdict.confidenceLevel.charAt(0).toUpperCase() + verdict.confidenceLevel.slice(1)} confidence
              </span>
              <span className="text-xs text-muted-foreground">
                · {verdict.timeHorizon}
              </span>
            </div>
            {verdict.summary.split('\n').filter(p => p.trim()).map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
