import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import type { PortfolioLot } from '@/lib/types';

// GET /api/investments/lots?assetId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId');

  if (!assetId) {
    return NextResponse.json({ error: 'assetId required' }, { status: 400 });
  }

  const lots = query<PortfolioLot>(
    'SELECT * FROM portfolio_lots WHERE asset_id = ? ORDER BY purchase_date DESC',
    Number(assetId)
  );

  return NextResponse.json({ lots });
}

// POST /api/investments/lots
export async function POST(req: NextRequest) {
  try {
    const { asset_id, quantity, price_per_unit, purchase_date, notes } = await req.json();

    if (!asset_id || !quantity || !price_per_unit || !purchase_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = run(
      `INSERT INTO portfolio_lots (asset_id, quantity, price_per_unit, purchase_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
      asset_id, quantity, price_per_unit, purchase_date, notes || null
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Lot create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create lot' },
      { status: 500 }
    );
  }
}

// PUT /api/investments/lots
export async function PUT(req: NextRequest) {
  try {
    const { id, quantity, price_per_unit, purchase_date, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (quantity !== undefined) { updates.push('quantity = ?'); values.push(quantity); }
    if (price_per_unit !== undefined) { updates.push('price_per_unit = ?'); values.push(price_per_unit); }
    if (purchase_date !== undefined) { updates.push('purchase_date = ?'); values.push(purchase_date); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    run(`UPDATE portfolio_lots SET ${updates.join(', ')} WHERE id = ?`, ...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lot update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update lot' },
      { status: 500 }
    );
  }
}

// DELETE /api/investments/lots?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  run('DELETE FROM portfolio_lots WHERE id = ?', Number(id));
  return NextResponse.json({ success: true });
}
