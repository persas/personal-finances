import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, ParsedTransaction } from '@/lib/types';

// GET /api/transactions?profileId=diego&month=1&year=2026
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  let sql = `SELECT * FROM transactions WHERE profile_id = ?`;
  const params: unknown[] = [profileId];

  if (month) {
    sql += ` AND month = ?`;
    params.push(Number(month));
  }
  if (year) {
    sql += ` AND year = ?`;
    params.push(Number(year));
  }

  sql += ` ORDER BY date ASC, id ASC`;

  const transactions = await query<Transaction>(sql, ...params);
  return NextResponse.json({ transactions });
}

// POST /api/transactions — save batch from upload
export async function POST(req: NextRequest) {
  try {
    const { profileId, transactions, filename, source } = await req.json() as {
      profileId: string;
      transactions: ParsedTransaction[];
      filename: string;
      source: string;
    };

    if (!profileId || !transactions?.length) {
      return NextResponse.json(
        { error: 'profileId and transactions are required' },
        { status: 400 }
      );
    }

    const batchId = uuidv4();

    // Save upload record
    await run(
      `INSERT INTO uploads (id, profile_id, source, filename, transaction_count)
       VALUES (?, ?, ?, ?, ?)`,
      batchId, profileId, source || 'Unknown', filename || 'upload.csv', transactions.length
    );

    // Save each transaction
    for (const tx of transactions) {
      const date = new Date(tx.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      await run(
        `INSERT INTO transactions (profile_id, date, description, amount, type, source, category, budget_group, budget_line, notes, upload_batch_id, month, year)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        profileId,
        tx.date,
        tx.description,
        tx.amount,
        tx.type,
        tx.source,
        tx.category,
        tx.budget_group,
        tx.budget_line,
        tx.notes,
        batchId,
        month,
        year
      );
    }

    return NextResponse.json({ success: true, batchId, count: transactions.length });
  } catch (error) {
    console.error('Transaction save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save transactions' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions — update single transaction
export async function PUT(req: NextRequest) {
  try {
    const { id, ...fields } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const allowedFields = ['category', 'budget_group', 'budget_line', 'notes', 'type', 'description', 'amount'];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);
    await run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, ...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions?id=123
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const batchId = searchParams.get('batchId');

  if (batchId) {
    await run(`DELETE FROM transactions WHERE upload_batch_id = ?`, batchId);
    await run(`DELETE FROM uploads WHERE id = ?`, batchId);
    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: 'id or batchId required' }, { status: 400 });
  }

  await run(`DELETE FROM transactions WHERE id = ?`, Number(id));
  return NextResponse.json({ success: true });
}
