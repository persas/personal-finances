import { NextRequest, NextResponse } from 'next/server';
import { query, run, getDb } from '@/lib/db';
import { recategorizeTransactions } from '@/lib/gemini';
import type { Transaction, BudgetLine } from '@/lib/types';

// POST /api/transactions/recategorize — get AI-proposed recategorization
export async function POST(req: NextRequest) {
  try {
    const { profileId, transactionIds, hint } = await req.json();

    if (!profileId || !hint) {
      return NextResponse.json(
        { error: 'profileId and hint are required' },
        { status: 400 }
      );
    }

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'transactionIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Fetch the specified transactions
    const placeholders = transactionIds.map(() => '?').join(',');
    const transactions = query<Transaction>(
      `SELECT * FROM transactions WHERE profile_id = ? AND id IN (${placeholders})`,
      profileId,
      ...transactionIds
    );

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found' },
        { status: 404 }
      );
    }

    // Fetch budget lines for context
    const year = transactions[0].year;
    const budgetLines = query<BudgetLine>(
      `SELECT * FROM budget_lines WHERE profile_id = ? AND year = ?`,
      profileId,
      year
    );

    // Get profile name
    const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };
    const profileName = profileNames[profileId] || profileId;

    // Call Gemini
    const changes = await recategorizeTransactions(transactions, hint, budgetLines, profileName);

    return NextResponse.json({ changes, totalAnalyzed: transactions.length });
  } catch (error) {
    console.error('Recategorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recategorize' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/recategorize — apply approved changes
export async function PATCH(req: NextRequest) {
  try {
    const { changes } = await req.json();

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { error: 'changes must be a non-empty array' },
        { status: 400 }
      );
    }

    const db = getDb();
    const stmt = db.prepare(
      `UPDATE transactions SET category = ?, budget_group = ?, budget_line = ?, type = ?, notes = ? WHERE id = ?`
    );

    const applyAll = db.transaction(() => {
      let updated = 0;
      for (const change of changes) {
        const result = stmt.run(
          change.category,
          change.budget_group,
          change.budget_line,
          change.type,
          change.notes,
          change.id
        );
        updated += result.changes;
      }
      return updated;
    });

    const updated = applyAll();

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Apply recategorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply changes' },
      { status: 500 }
    );
  }
}
