import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import type { BudgetLine } from '@/lib/types';

// GET /api/budgets?profileId=diego&year=2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const year = searchParams.get('year') || String(new Date().getFullYear());

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const budgets = await query<BudgetLine>(
    `SELECT * FROM budget_lines WHERE profile_id = ? AND year = ? ORDER BY budget_group, line_name`,
    profileId,
    Number(year)
  );

  return NextResponse.json({ budgets });
}

// POST /api/budgets — create budget line
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, budget_group, line_name, monthly_amount, annual_amount, is_annual, year } = body;

    if (!profile_id || !budget_group || !line_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const monthly = monthly_amount || 0;
    const annual = annual_amount || monthly * 12;
    const budgetYear = year || new Date().getFullYear();

    await run(
      `INSERT INTO budget_lines (profile_id, budget_group, line_name, monthly_amount, annual_amount, is_annual, year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      profile_id, budget_group, line_name, monthly, annual, is_annual || false, budgetYear
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Budget create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create budget line' },
      { status: 500 }
    );
  }
}

// PUT /api/budgets — update budget line
export async function PUT(req: NextRequest) {
  try {
    const { id, monthly_amount, annual_amount, is_annual, line_name, budget_group } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (monthly_amount !== undefined) { updates.push('monthly_amount = ?'); values.push(monthly_amount); }
    if (annual_amount !== undefined) { updates.push('annual_amount = ?'); values.push(annual_amount); }
    if (is_annual !== undefined) { updates.push('is_annual = ?'); values.push(is_annual); }
    if (line_name !== undefined) { updates.push('line_name = ?'); values.push(line_name); }
    if (budget_group !== undefined) { updates.push('budget_group = ?'); values.push(budget_group); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await run(`UPDATE budget_lines SET ${updates.join(', ')} WHERE id = ?`, ...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Budget update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  await run(`DELETE FROM budget_lines WHERE id = ?`, Number(id));
  return NextResponse.json({ success: true });
}
