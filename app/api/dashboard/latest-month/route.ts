import { NextRequest, NextResponse } from 'next/server';
import { get } from '@/lib/db';

// GET /api/dashboard/latest-month?profileId=diego&year=2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  // Most recent month in the requested year
  const result = get<{ month: number; year: number }>(
    `SELECT month, year FROM transactions WHERE profile_id = ? AND year = ? ORDER BY month DESC LIMIT 1`,
    profileId, year,
  );

  if (result) {
    return NextResponse.json(result);
  }

  // Fallback: most recent month in any year
  const fallback = get<{ month: number; year: number }>(
    `SELECT month, year FROM transactions WHERE profile_id = ? ORDER BY year DESC, month DESC LIMIT 1`,
    profileId,
  );

  return NextResponse.json(fallback || { month: new Date().getMonth() + 1, year });
}
