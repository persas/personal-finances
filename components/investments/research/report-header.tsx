'use client';

import { SentimentBadge } from '../sentiment-badge';
import { Badge } from '@/components/ui/badge';
import type { ResearchContent, Sentiment } from '@/lib/types';

interface Props {
  content: ResearchContent;
  ticker: string;
  name: string;
  sentiment: Sentiment | null;
  summary: string | null;
  researchDate: string;
}

function fmtLarge(v: number | null): string {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function ReportHeader({ content, ticker, name, sentiment, summary, researchDate }: Props) {
  const { metrics, business } = content;
  const price = metrics.price;
  const w52h = metrics.week52High;
  const w52l = metrics.week52Low;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{name}</h2>
            <Badge variant="outline" className="font-mono text-sm">{ticker}</Badge>
            {sentiment && <SentimentBadge sentiment={sentiment} />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {business.sector && <span>{business.sector}</span>}
            {business.country && <span>· {business.country}</span>}
            <span>· Researched {new Date(researchDate).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}</span>
          </div>
        </div>
        {price != null && (
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold">${price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              52W: ${w52l?.toFixed(2) ?? '—'} — ${w52h?.toFixed(2) ?? '—'}
            </p>
          </div>
        )}
      </div>
      {summary && (
        <p className="text-sm text-muted-foreground italic">{summary}</p>
      )}
      {metrics.marketCap != null && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Market Cap: {fmtLarge(metrics.marketCap)}</span>
          {metrics.beta != null && <span>Beta: {metrics.beta.toFixed(2)}</span>}
          {metrics.dividendYield != null && <span>Div Yield: {(metrics.dividendYield * 100).toFixed(2)}%</span>}
        </div>
      )}
    </div>
  );
}
