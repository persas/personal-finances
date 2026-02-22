'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PiggyBank, Calendar } from 'lucide-react';

interface KPIData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  dailyAvgSpend: number;
  transactionCount: number;
}

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function KPICards({ data }: { data: KPIData }) {
  const cards = [
    {
      label: 'Total Income',
      value: `${fmt(data.totalIncome)}`,
      icon: TrendingUp,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      accentColor: '#10b981',
      subtitle: '',
    },
    {
      label: 'Total Expenses',
      value: `${fmt(data.totalExpenses)}`,
      icon: TrendingDown,
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      accentColor: '#ef4444',
      subtitle: `${data.transactionCount} transactions`,
    },
    {
      label: 'Net Savings',
      value: `${fmt(data.netSavings)}`,
      icon: PiggyBank,
      textColor: data.netSavings >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      bgColor: data.netSavings >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      accentColor: data.netSavings >= 0 ? '#10b981' : '#ef4444',
      subtitle: `Rate: ${data.savingsRate.toFixed(1)}%`,
    },
    {
      label: 'Daily Avg Spend',
      value: `${fmt(data.dailyAvgSpend)}`,
      icon: Calendar,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      accentColor: '#f59e0b',
      subtitle: '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="relative overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: card.accentColor }}
            />
            <CardContent className="pt-5 pb-5 pl-7">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold tracking-tight ${card.textColor}`}>
                    {card.value}
                    <span className="text-base font-semibold ml-0.5 opacity-70">&euro;</span>
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
