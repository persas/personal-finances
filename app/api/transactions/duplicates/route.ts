import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import type { Transaction } from '@/lib/types';

interface DuplicateGroup {
  key: string;
  date: string;
  amount: number;
  description: string;
  transactions: Transaction[];
}

// GET /api/transactions/duplicates?profileId=X&year=Y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const year = searchParams.get('year');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  let sql = `SELECT * FROM transactions WHERE profile_id = ?`;
  const params: unknown[] = [profileId];

  if (year) {
    sql += ` AND year = ?`;
    params.push(Number(year));
  }

  sql += ` ORDER BY date ASC, id ASC`;

  const transactions = query<Transaction>(sql, ...params);

  // Group by date + amount (normalized to 2 decimals)
  const groups: Record<string, Transaction[]> = {};
  for (const tx of transactions) {
    const key = `${tx.date}|${Number(tx.amount).toFixed(2)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  // Filter to groups with 2+ members and build response
  const duplicates: DuplicateGroup[] = Object.entries(groups)
    .filter(([, txs]) => txs.length >= 2)
    .map(([key, txs]) => ({
      key,
      date: txs[0].date,
      amount: Number(txs[0].amount),
      description: txs[0].description,
      transactions: txs,
    }))
    .sort((a, b) => b.transactions.length - a.transactions.length);

  return NextResponse.json({
    groups: duplicates,
    totalDuplicates: duplicates.reduce((sum, g) => sum + g.transactions.length - 1, 0),
  });
}

// DELETE /api/transactions/duplicates — batch delete by IDs
export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: number[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const placeholders = ids.map(() => '?').join(', ');
    const result = run(`DELETE FROM transactions WHERE id IN (${placeholders})`, ...ids);

    return NextResponse.json({ success: true, deleted: result.changes });
  } catch (error) {
    console.error('Batch delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}
