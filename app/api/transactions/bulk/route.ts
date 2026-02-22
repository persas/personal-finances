import { NextRequest, NextResponse } from 'next/server';
import { run, query } from '@/lib/db';

// PATCH /api/transactions/bulk — bulk find-and-replace a field
export async function PATCH(req: NextRequest) {
  try {
    const { profileId, field, oldValue, newValue, year } = await req.json();

    if (!profileId || !field || oldValue === undefined || newValue === undefined) {
      return NextResponse.json(
        { error: 'profileId, field, oldValue, and newValue are required' },
        { status: 400 }
      );
    }

    const allowedFields = ['source', 'category', 'budget_group', 'budget_line', 'type'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field. Allowed: ${allowedFields.join(', ')}` },
        { status: 400 }
      );
    }

    let sql = `UPDATE transactions SET ${field} = ? WHERE profile_id = ? AND ${field} = ?`;
    const params: unknown[] = [newValue, profileId, oldValue];

    if (year) {
      sql += ` AND year = ?`;
      params.push(Number(year));
    }

    const result = run(sql, ...params);
    return NextResponse.json({ success: true, updated: result.changes });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to bulk update' },
      { status: 500 }
    );
  }
}

// GET /api/transactions/bulk?profileId=X&field=source&year=2026 — get unique values for a field
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const field = searchParams.get('field') || 'source';
  const year = searchParams.get('year');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const allowedFields = ['source', 'category', 'budget_group', 'budget_line', 'type'];
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
  }

  let sql = `SELECT DISTINCT ${field} as value, COUNT(*) as count FROM transactions WHERE profile_id = ? AND ${field} IS NOT NULL`;
  const params: unknown[] = [profileId];

  if (year) {
    sql += ` AND year = ?`;
    params.push(Number(year));
  }

  sql += ` GROUP BY ${field} ORDER BY count DESC`;

  const values = query<{ value: string; count: number }>(sql, ...params);
  return NextResponse.json({ values });
}
