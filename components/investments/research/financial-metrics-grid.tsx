'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard, evaluateHealth } from './metric-card';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

function fmtNum(v: number | null): string {
  if (v == null) return '—';
  return v.toFixed(2);
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtLarge(v: number | null): string {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function FinancialMetricsGrid({ content }: Props) {
  const { metrics } = content;

  const valuationMetrics = [
    { label: 'P/E (TTM)', value: fmtNum(metrics.trailingPE), health: evaluateHealth(metrics.trailingPE, { good: [0, 25], neutral: [25, 40] }) },
    { label: 'Forward P/E', value: fmtNum(metrics.forwardPE), health: evaluateHealth(metrics.forwardPE, { good: [0, 22], neutral: [22, 35] }) },
    { label: 'PEG Ratio', value: fmtNum(metrics.pegRatio), health: evaluateHealth(metrics.pegRatio, { good: [0, 1.5], neutral: [1.5, 2.5] }) },
    { label: 'P/B', value: fmtNum(metrics.priceToBook), health: evaluateHealth(metrics.priceToBook, { good: [0, 5], neutral: [5, 15] }) },
    { label: 'EV/EBITDA', value: fmtNum(metrics.evToEbitda), health: evaluateHealth(metrics.evToEbitda, { good: [0, 18], neutral: [18, 30] }) },
    { label: 'P/S', value: fmtNum(metrics.priceToSales), health: evaluateHealth(metrics.priceToSales, { good: [0, 8], neutral: [8, 20] }) },
  ].filter(m => m.value !== '—');

  const profitabilityMetrics = [
    { label: 'Gross Margin', value: fmtPct(metrics.grossMargin), health: evaluateHealth(metrics.grossMargin, { good: [0.5, 1], neutral: [0.3, 0.5] }) },
    { label: 'Operating Margin', value: fmtPct(metrics.operatingMargin), health: evaluateHealth(metrics.operatingMargin, { good: [0.2, 1], neutral: [0.1, 0.2] }) },
    { label: 'Net Margin', value: fmtPct(metrics.netMargin), health: evaluateHealth(metrics.netMargin, { good: [0.15, 1], neutral: [0.05, 0.15] }) },
    { label: 'ROE', value: fmtPct(metrics.returnOnEquity), health: evaluateHealth(metrics.returnOnEquity, { good: [0.15, 5], neutral: [0.08, 0.15] }) },
    { label: 'ROA', value: fmtPct(metrics.returnOnAssets), health: evaluateHealth(metrics.returnOnAssets, { good: [0.08, 5], neutral: [0.03, 0.08] }) },
    { label: 'ROIC', value: fmtPct(metrics.roic), health: evaluateHealth(metrics.roic, { good: [0.15, 5], neutral: [0.08, 0.15] }) },
  ].filter(m => m.value !== '—');

  const growthMetrics = [
    { label: 'Revenue Growth', value: fmtPct(metrics.revenueGrowth), health: evaluateHealth(metrics.revenueGrowth, { good: [0.1, 10], neutral: [0, 0.1] }) },
    { label: 'Earnings Growth', value: fmtPct(metrics.earningsGrowth), health: evaluateHealth(metrics.earningsGrowth, { good: [0.1, 10], neutral: [0, 0.1] }) },
    { label: 'EPS (TTM)', value: metrics.trailingEps != null ? `$${metrics.trailingEps.toFixed(2)}` : '—', health: null },
    { label: 'Forward EPS', value: metrics.forwardEps != null ? `$${metrics.forwardEps.toFixed(2)}` : '—', health: null },
  ].filter(m => m.value !== '—');

  const balanceSheetMetrics = [
    { label: 'Total Cash', value: fmtLarge(metrics.totalCash), health: null },
    { label: 'Total Debt', value: fmtLarge(metrics.totalDebt), health: null },
    { label: 'Debt/Equity', value: fmtNum(metrics.debtToEquity), health: evaluateHealth(metrics.debtToEquity, { good: [0, 0.5], neutral: [0.5, 1.5] }) },
    { label: 'Current Ratio', value: fmtNum(metrics.currentRatio), health: evaluateHealth(metrics.currentRatio, { good: [1.5, 100], neutral: [1, 1.5] }) },
    { label: 'FCF Yield', value: fmtPct(metrics.fcfYield), health: evaluateHealth(metrics.fcfYield, { good: [0.05, 10], neutral: [0.02, 0.05] }) },
    { label: 'Book Value', value: metrics.bookValue != null ? `$${metrics.bookValue.toFixed(2)}` : '—', health: null },
  ].filter(m => m.value !== '—');

  const sections = [
    { title: 'Valuation', items: valuationMetrics },
    { title: 'Profitability', items: profitabilityMetrics },
    { title: 'Growth', items: growthMetrics },
    { title: 'Balance Sheet & Cash Flow', items: balanceSheetMetrics },
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {section.title}
          </h3>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {section.items.map(item => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value}
                health={item.health}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
