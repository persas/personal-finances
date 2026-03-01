import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Transaction, BudgetLine, Profile, YearlyDashboardData, CategoryTotal } from '@/lib/types';
import { SAVINGS_INVESTMENT_GROUPS } from '@/lib/categories';

// GET /api/dashboard/yearly?profileId=diego&year=2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const profiles = await query<Profile>(`SELECT * FROM profiles WHERE id = ?`, profileId);
  if (profiles.length === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // All transactions for the year
  const transactions = await query<Transaction>(
    `SELECT * FROM transactions WHERE profile_id = ? AND year = ? ORDER BY date ASC`,
    profileId, year
  );

  // Budget lines
  const budgetLines = await query<BudgetLine>(
    `SELECT * FROM budget_lines WHERE profile_id = ? AND year = ?`,
    profileId, year
  );

  // KPIs — separate true expenses from savings/investments
  // Reimbursements classified as income should reduce expenses, not inflate income
  const isReimbursement = (t: Transaction) => t.type === 'income' && t.category === 'Reimbursement';
  const creditOrReimbursement = (t: Transaction) => t.type === 'credit' || isReimbursement(t);
  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'credit' || isReimbursement(t));
  const income = transactions.filter(t => t.type === 'income' && !isReimbursement(t));

  const trueExpenses = expenses.filter(t => !SAVINGS_INVESTMENT_GROUPS.has(t.budget_group || ''));
  const savingsInvestmentTxs = expenses.filter(t => SAVINGS_INVESTMENT_GROUPS.has(t.budget_group || ''));

  const totalExpenses = trueExpenses.reduce((sum, t) =>
    sum + (creditOrReimbursement(t) ? -Number(t.amount) : Number(t.amount)), 0);
  const totalSavingsInvestments = savingsInvestmentTxs.reduce((sum, t) =>
    sum + (creditOrReimbursement(t) ? -Number(t.amount) : Number(t.amount)), 0);
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Months with data
  const monthsWithData = new Set(transactions.map(t => t.month)).size;

  // Monthly trend (expenses exclude savings/investments)
  const monthlyMap: Record<number, { income: number; expenses: number }> = {};
  for (let m = 1; m <= 12; m++) monthlyMap[m] = { income: 0, expenses: 0 };

  for (const tx of transactions) {
    if (tx.type === 'income' && !isReimbursement(tx)) {
      monthlyMap[tx.month].income += Number(tx.amount);
    } else if ((tx.type === 'expense' || tx.type === 'credit' || isReimbursement(tx)) && !SAVINGS_INVESTMENT_GROUPS.has(tx.budget_group || '')) {
      const amount = creditOrReimbursement(tx) ? -Number(tx.amount) : Number(tx.amount);
      monthlyMap[tx.month].expenses += amount;
    }
  }

  const monthlyTrend = Object.entries(monthlyMap).map(([month, data]) => ({
    month: Number(month),
    income: data.income,
    expenses: data.expenses,
  }));

  // Annual budget burn per line
  const annualBudgetBurn = budgetLines.map(bl => {
    const annualBudget = Number(bl.annual_amount) || Number(bl.monthly_amount) * 12;
    const spentYTD = expenses
      .filter(tx => tx.budget_group === bl.budget_group && tx.budget_line === bl.line_name)
      .reduce((sum, tx) => sum + (creditOrReimbursement(tx) ? -Number(tx.amount) : Number(tx.amount)), 0);

    return {
      group: bl.budget_group,
      line: bl.line_name,
      annualBudget,
      spentYTD,
      percentUsed: annualBudget > 0 ? (spentYTD / annualBudget) * 100 : 0,
    };
  });

  // Budget group summary (aggregate annualBudgetBurn by group)
  const groupMap: Record<string, { budget: number; spent: number }> = {};
  for (const item of annualBudgetBurn) {
    if (!groupMap[item.group]) groupMap[item.group] = { budget: 0, spent: 0 };
    groupMap[item.group].budget += item.annualBudget;
    groupMap[item.group].spent += item.spentYTD;
  }

  const expectedPace = (monthsWithData / 12) * 100;

  const budgetGroupSummary = Object.entries(groupMap).map(([group, gData]) => {
    const percentUsed = gData.budget > 0 ? (gData.spent / gData.budget) * 100 : 0;
    return {
      group,
      annualBudget: gData.budget,
      spentYTD: gData.spent,
      percentUsed,
      remainingBudget: gData.budget - gData.spent,
      expectedPace,
      status: (percentUsed > 100 ? 'over_budget'
        : percentUsed > expectedPace ? 'over_pace'
        : 'on_track') as 'on_track' | 'over_pace' | 'over_budget',
    };
  });

  // Monthly spending by budget group
  const budgetGroupNames = ['Fixed Costs', 'Savings Goals', 'Guilt-Free', 'Investments', 'Pre-Tax'];
  const monthlyGroupMap: Record<number, Record<string, number>> = {};
  for (let m = 1; m <= 12; m++) {
    monthlyGroupMap[m] = {};
    for (const g of budgetGroupNames) {
      monthlyGroupMap[m][g] = 0;
    }
  }

  for (const tx of expenses) {
    const group = tx.budget_group;
    if (group && monthlyGroupMap[tx.month] && monthlyGroupMap[tx.month][group] !== undefined) {
      const amount = creditOrReimbursement(tx) ? -Number(tx.amount) : Number(tx.amount);
      monthlyGroupMap[tx.month][group] += amount;
    }
  }

  const monthlyByGroup = Object.entries(monthlyGroupMap).map(([month, groups]) => ({
    month: Number(month),
    ...groups,
  }));

  // Category breakdown YTD (true expenses only, not savings/investments)
  const catMap: Record<string, { total: number; count: number }> = {};
  for (const tx of trueExpenses) {
    const cat = tx.category || 'Uncategorized';
    const amount = creditOrReimbursement(tx) ? -Number(tx.amount) : Number(tx.amount);
    if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
    catMap[cat].total += amount;
    catMap[cat].count += 1;
  }

  const categoryBreakdown: CategoryTotal[] = Object.entries(catMap)
    .map(([category, data]) => ({ category, total: data.total, count: data.count }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const data: YearlyDashboardData = {
    profile: profiles[0],
    year,
    kpis: { totalIncome, totalExpenses, totalSavingsInvestments, netSavings, savingsRate, monthsWithData },
    monthlyTrend,
    annualBudgetBurn,
    budgetGroupSummary,
    monthlyByGroup,
    categoryBreakdown,
  };

  return NextResponse.json(data);
}
