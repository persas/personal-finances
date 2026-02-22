'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { BudgetVsActual } from '@/components/dashboard/budget-vs-actual';
import { CategoryDonut } from '@/components/dashboard/category-donut';
import { SpendingBar } from '@/components/dashboard/spending-bar';
import { IncomeVsExpenses } from '@/components/dashboard/income-vs-expenses';
import { Loader2, BarChart3 } from 'lucide-react';
import type { DashboardData } from '@/lib/types';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DashboardPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const searchParams = useSearchParams();
  const month = Number(searchParams.get('month')) || new Date().getMonth() + 1;
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?profileId=${profile}&month=${month}&year=${year}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile, month, year]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Dashboard" subtitle="Loading..." showMonthPicker />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data || data.kpis.transactionCount === 0) {
    return (
      <div className="flex flex-col">
        <Header
          title={`${profileNames[profile] || profile}'s Dashboard`}
          subtitle={`${MONTHS[month]} ${year}`}
          showMonthPicker
        />
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No data for {MONTHS[month]} {year}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a bank statement CSV to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title={`${profileNames[profile] || profile}'s Dashboard`}
        subtitle={`${MONTHS[month]} ${year}`}
        showMonthPicker
      />

      <div className="space-y-6 p-6 lg:p-8">
        <KPICards data={data.kpis} />

        <BudgetVsActual
          groups={data.budgetComparison.groups}
          lines={data.budgetComparison.lines}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <IncomeVsExpenses
            totalIncome={data.kpis.totalIncome}
            totalExpenses={data.kpis.totalExpenses}
            netSavings={data.kpis.netSavings}
          />
          <CategoryDonut data={data.categoryBreakdown} />
        </div>

        <SpendingBar data={data.categoryBreakdown} />
      </div>
    </div>
  );
}
