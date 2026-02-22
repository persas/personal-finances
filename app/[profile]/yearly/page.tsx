'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { CategoryDonut } from '@/components/dashboard/category-donut';
import { SpendingBar } from '@/components/dashboard/spending-bar';
import { MonthlyTrend } from '@/components/dashboard/monthly-trend';
import { YearlyBudgetBurn } from '@/components/dashboard/yearly-budget-burn';
import { BudgetGroupChart } from '@/components/dashboard/budget-group-chart';
import { MonthlyGroupTrend } from '@/components/dashboard/monthly-group-trend';
import { Loader2, CalendarDays } from 'lucide-react';
import type { YearlyDashboardData } from '@/lib/types';

export default function YearlyPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  const [data, setData] = useState<YearlyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/yearly?profileId=${profile}&year=${year}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [profile, year]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Year to Date" subtitle="Loading..." showYearPicker />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data || data.kpis.monthsWithData === 0) {
    return (
      <div className="flex flex-col">
        <Header title={`${profileNames[profile]} — Year to Date`} subtitle={`${year}`} showYearPicker />
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold">No data for {year}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Upload bank statements to see yearly trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header
        title={`${profileNames[profile]} — Year to Date`}
        subtitle={`${year} — ${data.kpis.monthsWithData} month(s) with data`}
        showYearPicker
      />

      <div className="space-y-6 p-8">
        <KPICards
          data={{
            totalIncome: data.kpis.totalIncome,
            totalExpenses: data.kpis.totalExpenses,
            netSavings: data.kpis.netSavings,
            savingsRate: data.kpis.savingsRate,
            dailyAvgSpend: data.kpis.totalExpenses / (data.kpis.monthsWithData * 30),
            transactionCount: data.kpis.monthsWithData,
          }}
        />

        <BudgetGroupChart data={data.budgetGroupSummary} />

        <MonthlyGroupTrend data={data.monthlyByGroup} />

        <YearlyBudgetBurn data={data.annualBudgetBurn} year={year} />

        <MonthlyTrend data={data.monthlyTrend} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryDonut data={data.categoryBreakdown} />
          <SpendingBar data={data.categoryBreakdown} />
        </div>
      </div>
    </div>
  );
}
