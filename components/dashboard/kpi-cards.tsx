'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar, Receipt } from 'lucide-react';

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
      value: `${fmt(data.totalIncome)}€`,
      icon: TrendingUp,
      color: 'text-green-400',
      subtitle: '',
    },
    {
      label: 'Total Expenses',
      value: `${fmt(data.totalExpenses)}€`,
      icon: TrendingDown,
      color: 'text-red-400',
      subtitle: `${data.transactionCount} transactions`,
    },
    {
      label: 'Net Savings',
      value: `${fmt(data.netSavings)}€`,
      icon: PiggyBank,
      color: data.netSavings >= 0 ? 'text-green-400' : 'text-red-400',
      subtitle: `Rate: ${data.savingsRate.toFixed(1)}%`,
    },
    {
      label: 'Daily Avg Spend',
      value: `${fmt(data.dailyAvgSpend)}€`,
      icon: Calendar,
      color: 'text-yellow-400',
      subtitle: '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                  {card.subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <Icon className={`h-8 w-8 ${card.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
