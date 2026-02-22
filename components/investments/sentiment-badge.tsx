'use client';

import { Badge } from '@/components/ui/badge';
import type { Sentiment } from '@/lib/types';

const SENTIMENT_CONFIG: Record<string, { label: string; className: string }> = {
  bullish: { label: 'Bullish', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  bearish: { label: 'Bearish', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  neutral: { label: 'Neutral', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  mixed: { label: 'Mixed', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  const config = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
