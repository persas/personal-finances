import { NextRequest, NextResponse } from 'next/server';
import { query, run, get } from '@/lib/db';
import { analyzeMonth } from '@/lib/gemini';
import type {
  Transaction,
  BudgetLine,
  Profile,
  DashboardData,
  BudgetGroupSummary,
  BudgetLineSummary,
  CategoryTotal,
  Report,
} from '@/lib/types';

function buildDashboardData(profileId: string, month: number, year: number): DashboardData | null {
  const profiles = query<Profile>(`SELECT * FROM profiles WHERE id = ?`, profileId);
  if (profiles.length === 0) return null;

  const transactions = query<Transaction>(
    `SELECT * FROM transactions WHERE profile_id = ? AND month = ? AND year = ? ORDER BY date ASC`,
    profileId, month, year
  );

  const budgetLines = query<BudgetLine>(
    `SELECT * FROM budget_lines WHERE profile_id = ? AND year = ?`,
    profileId, year
  );

  const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'credit');
  const income = transactions.filter(t => t.type === 'income');

  const totalExpenses = expenses.reduce((sum, t) => {
    return sum + (t.type === 'credit' ? -Number(t.amount) : Number(t.amount));
  }, 0);

  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyAvgSpend = totalExpenses / daysInMonth;

  const groupBudgets: Record<string, number> = {};
  const groupActuals: Record<string, number> = {};
  const lineBudgets: Record<string, { group: string; budget: number; actual: number }> = {};

  for (const bl of budgetLines) {
    const key = `${bl.budget_group}::${bl.line_name}`;
    const monthlyBudget = bl.is_annual ? Number(bl.annual_amount) / 12 : Number(bl.monthly_amount);
    groupBudgets[bl.budget_group] = (groupBudgets[bl.budget_group] || 0) + monthlyBudget;
    lineBudgets[key] = { group: bl.budget_group, budget: monthlyBudget, actual: 0 };
  }

  for (const tx of expenses) {
    const bg = tx.budget_group || '';
    const bl = tx.budget_line || '';
    const amount = tx.type === 'credit' ? -Number(tx.amount) : Number(tx.amount);

    if (bg && bg !== 'Income' && bg !== 'Transfer' && bg !== 'Internal') {
      groupActuals[bg] = (groupActuals[bg] || 0) + amount;
      const key = `${bg}::${bl}`;
      if (lineBudgets[key]) {
        lineBudgets[key].actual += amount;
      }
    }
  }

  const groups: BudgetGroupSummary[] = Object.keys(groupBudgets).map(group => ({
    group,
    budget: groupBudgets[group],
    actual: groupActuals[group] || 0,
    delta: (groupActuals[group] || 0) - groupBudgets[group],
  }));

  const lines: BudgetLineSummary[] = Object.entries(lineBudgets).map(([key, val]) => {
    const [, line] = key.split('::');
    return { group: val.group, line, budget: val.budget, actual: val.actual, delta: val.actual - val.budget };
  });

  const catMap: Record<string, { total: number; count: number }> = {};
  for (const tx of expenses) {
    const cat = tx.category || 'Uncategorized';
    const amount = tx.type === 'credit' ? -Number(tx.amount) : Number(tx.amount);
    if (!catMap[cat]) catMap[cat] = { total: 0, count: 0 };
    catMap[cat].total += amount;
    catMap[cat].count += 1;
  }

  const categoryBreakdown: CategoryTotal[] = Object.entries(catMap)
    .map(([category, d]) => ({ category, total: d.total, count: d.count }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return {
    profile: profiles[0],
    month,
    year,
    kpis: { totalIncome, totalExpenses, netSavings, savingsRate, dailyAvgSpend, transactionCount: transactions.length },
    budgetComparison: { groups, lines },
    categoryBreakdown,
    transactions,
  };
}

// GET /api/reports?profileId=diego&month=1&year=2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));

  if (!profileId || !month || !year) {
    return NextResponse.json({ error: 'profileId, month, and year are required' }, { status: 400 });
  }

  const report = get<Report>(
    `SELECT * FROM reports WHERE profile_id = ? AND month = ? AND year = ?`,
    profileId, month, year
  );

  return NextResponse.json({ report: report || null });
}

// POST /api/reports — generate and store a new report
export async function POST(req: NextRequest) {
  try {
    const { profileId, month, year, userComments } = await req.json();

    if (!profileId || !month || !year) {
      return NextResponse.json({ error: 'profileId, month, and year are required' }, { status: 400 });
    }

    const data = buildDashboardData(profileId, month, year);
    if (!data || data.kpis.transactionCount === 0) {
      return NextResponse.json({ error: 'No transaction data for this month' }, { status: 404 });
    }

    const profileName = data.profile.name;
    const reportText = await analyzeMonth(data, userComments || null, profileName);

    // Upsert — replace existing report for this profile/month/year
    run(
      `INSERT INTO reports (profile_id, month, year, user_comments, report_text, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(profile_id, month, year)
       DO UPDATE SET user_comments = excluded.user_comments, report_text = excluded.report_text, created_at = datetime('now')`,
      profileId, month, year, userComments || null, reportText
    );

    const report = get<Report>(
      `SELECT * FROM reports WHERE profile_id = ? AND month = ? AND year = ?`,
      profileId, month, year
    );

    return NextResponse.json({ report });
  } catch (error) {
    console.error('[reports] ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
