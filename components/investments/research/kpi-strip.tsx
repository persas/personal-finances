'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign, TrendingUp, BarChart3, Target, Activity, Layers,
  AlertTriangle, Sparkles,
} from 'lucide-react';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

function fmtLarge(v: number | null): string {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

// Maps KPI card keys to the aiEstimatedMetrics keys
const metricKeyMap: Record<string, string> = {
  'Market Cap': 'marketCap',
  'P/E (TTM)': 'trailingPE',
  'Revenue Growth': 'revenueGrowth',
  'FCF Yield': 'fcfYield',
  'Analyst Target': 'targetMeanPrice',
  'EPS (TTM)': 'trailingEps',
};

export function KpiStrip({ content }: Props) {
  const { metrics, analystData, dataWarnings, aiEstimatedMetrics } = content;
  const aiSet = new Set(aiEstimatedMetrics ?? []);

  const cards = [
    {
      label: 'Market Cap',
      value: metrics.marketCap != null ? `$${fmtLarge(metrics.marketCap)}` : '—',
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      accent: '#3b82f6',
    },
    {
      label: 'P/E (TTM)',
      value: metrics.trailingPE != null ? metrics.trailingPE.toFixed(1) : '—',
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
      accent: '#8b5cf6',
    },
    {
      label: 'Revenue Growth',
      value: fmtPct(metrics.revenueGrowth),
      icon: TrendingUp,
      color: metrics.revenueGrowth != null && metrics.revenueGrowth >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      bg: metrics.revenueGrowth != null && metrics.revenueGrowth >= 0
        ? 'bg-emerald-500/10' : 'bg-red-500/10',
      accent: metrics.revenueGrowth != null && metrics.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
    },
    {
      label: 'FCF Yield',
      value: metrics.fcfYield != null ? fmtPct(metrics.fcfYield) : '—',
      icon: Activity,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      accent: '#f59e0b',
    },
    {
      label: 'Analyst Target',
      value: analystData.targetMeanPrice != null ? `$${analystData.targetMeanPrice.toFixed(0)}` : '—',
      icon: Target,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
      accent: '#06b6d4',
      subtitle: analystData.targetMeanPrice != null && metrics.price != null
        ? `${(((analystData.targetMeanPrice - metrics.price) / metrics.price) * 100).toFixed(1)}% upside`
        : undefined,
    },
    {
      label: 'EPS (TTM)',
      value: metrics.trailingEps != null ? `$${metrics.trailingEps.toFixed(2)}` : '—',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      accent: '#6366f1',
    },
  ];

  return (
    <div className="space-y-3">
      {dataWarnings && dataWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            {dataWarnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const metricKey = metricKeyMap[card.label];
          const isAiEstimated = metricKey ? aiSet.has(metricKey) : false;
          return (
            <Card key={card.label} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                style={{ backgroundColor: card.accent }}
              />
              <CardContent className="py-3 pl-5 pr-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {card.label}
                    </p>
                    <p className={`text-lg font-bold tracking-tight ${card.color}`}>
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-[10px] text-muted-foreground">{card.subtitle}</p>
                    )}
                    {isAiEstimated && (
                      <p className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
                        <Sparkles className="h-2.5 w-2.5" />
                        Estimado por IA
                      </p>
                    )}
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
