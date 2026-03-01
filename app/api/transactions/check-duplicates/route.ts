import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Transaction, ParsedTransaction } from '@/lib/types';

// POST /api/transactions/check-duplicates
// Checks incoming transactions against existing DB transactions
// Returns which ones are duplicates (matching date + amount + description)
export async function POST(req: NextRequest) {
  try {
    const { profileId, transactions } = await req.json() as {
      profileId: string;
      transactions: ParsedTransaction[];
    };

    if (!profileId || !transactions?.length) {
      return NextResponse.json({ duplicates: [], newTransactions: transactions || [] });
    }

    // Get all unique dates from incoming transactions
    const dates = [...new Set(transactions.map(tx => tx.date))];
    const placeholders = dates.map(() => '?').join(', ');

    // Fetch existing transactions for those dates
    const existing = query<Transaction>(
      `SELECT date, description, amount, type FROM transactions
       WHERE profile_id = ? AND date IN (${placeholders})`,
      profileId,
      ...dates
    );

    // Build a set of existing transaction keys for fast lookup
    const existingKeys = new Set(
      existing.map(tx =>
        `${tx.date}|${Number(tx.amount).toFixed(2)}|${tx.description.toLowerCase().trim()}`
      )
    );

    const duplicates: ParsedTransaction[] = [];
    const newTransactions: ParsedTransaction[] = [];

    for (const tx of transactions) {
      const key = `${tx.date}|${Number(tx.amount).toFixed(2)}|${tx.description.toLowerCase().trim()}`;
      if (existingKeys.has(key)) {
        duplicates.push(tx);
      } else {
        newTransactions.push(tx);
      }
    }

    return NextResponse.json({ duplicates, newTransactions });
  } catch (error) {
    console.error('Check duplicates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}
