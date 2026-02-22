import { NextRequest, NextResponse } from 'next/server';
import { query, run, get } from '@/lib/db';
import type { PortfolioAsset, PortfolioLot, PortfolioHolding, PortfolioSummary, AssetType } from '@/lib/types';

interface AssetRow extends PortfolioAsset {
  total_quantity: number;
  total_cost: number;
  current_price: number | null;
  last_price_date: string | null;
  last_price_source: string | null;
}

// GET /api/investments/assets?profileId=diego
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const assets = query<AssetRow>(
    `SELECT
      a.*,
      COALESCE(l.total_quantity, 0) as total_quantity,
      COALESCE(l.total_cost, 0) as total_cost,
      p.price as current_price,
      p.date as last_price_date,
      p.source as last_price_source
    FROM portfolio_assets a
    LEFT JOIN (
      SELECT asset_id,
        SUM(quantity) as total_quantity,
        SUM(quantity * price_per_unit) as total_cost
      FROM portfolio_lots GROUP BY asset_id
    ) l ON a.id = l.asset_id
    LEFT JOIN (
      SELECT asset_id, price, date, source,
        ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY date DESC, id DESC) as rn
      FROM asset_prices
    ) p ON a.id = p.asset_id AND p.rn = 1
    WHERE a.profile_id = ?
    ORDER BY COALESCE(l.total_quantity * p.price, l.total_cost, 0) DESC`,
    profileId
  );

  const holdings: PortfolioHolding[] = assets.map(row => {
    const lots = query<PortfolioLot>(
      'SELECT * FROM portfolio_lots WHERE asset_id = ? ORDER BY purchase_date DESC',
      row.id
    );

    const totalQuantity = row.total_quantity;
    const totalCost = row.total_cost;
    const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const currentPrice = row.current_price;
    const currentValue = currentPrice != null && totalQuantity > 0 ? totalQuantity * currentPrice : null;
    const gainLoss = currentValue != null ? currentValue - totalCost : null;
    const gainLossPercent = gainLoss != null && totalCost > 0 ? (gainLoss / totalCost) * 100 : null;

    return {
      asset: {
        id: row.id,
        profile_id: row.profile_id,
        name: row.name,
        ticker: row.ticker,
        asset_type: row.asset_type,
        is_public: row.is_public,
        provider_id: row.provider_id,
        currency: row.currency,
        notes: row.notes,
        created_at: row.created_at,
      },
      lots,
      totalQuantity,
      totalCost,
      avgCostPerUnit,
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercent,
      lastPriceDate: row.last_price_date,
      lastPriceSource: row.last_price_source as PortfolioHolding['lastPriceSource'],
    };
  });

  let totalValue = 0;
  let totalCost = 0;
  const allocationMap = new Map<AssetType, number>();

  for (const h of holdings) {
    totalCost += h.totalCost;
    const value = h.currentValue ?? h.totalCost;
    totalValue += value;
    allocationMap.set(h.asset.asset_type, (allocationMap.get(h.asset.asset_type) || 0) + value);
  }

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  const allocationByType = Array.from(allocationMap.entries()).map(([type, value]) => ({
    type,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));

  const summary: PortfolioSummary = {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    holdings,
    allocationByType,
  };

  return NextResponse.json(summary);
}

// POST /api/investments/assets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, name, ticker, asset_type, is_public, provider_id, currency, notes, lot } = body;

    if (!profile_id || !name || !asset_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = run(
      `INSERT INTO portfolio_assets (profile_id, name, ticker, asset_type, is_public, provider_id, currency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      profile_id, name, ticker || null, asset_type, is_public ? 1 : 0,
      provider_id || null, currency || 'EUR', notes || null
    );

    const assetId = result.lastInsertRowid;

    // Optionally create initial lot
    if (lot && lot.quantity && lot.price_per_unit && lot.purchase_date) {
      run(
        `INSERT INTO portfolio_lots (asset_id, quantity, price_per_unit, purchase_date, notes)
         VALUES (?, ?, ?, ?, ?)`,
        assetId, lot.quantity, lot.price_per_unit, lot.purchase_date, lot.notes || null
      );
    }

    return NextResponse.json({ success: true, id: assetId });
  } catch (error) {
    console.error('Asset create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create asset' },
      { status: 500 }
    );
  }
}

// PUT /api/investments/assets
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, ticker, asset_type, is_public, provider_id, currency, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (ticker !== undefined) { updates.push('ticker = ?'); values.push(ticker || null); }
    if (asset_type !== undefined) { updates.push('asset_type = ?'); values.push(asset_type); }
    if (is_public !== undefined) { updates.push('is_public = ?'); values.push(is_public ? 1 : 0); }
    if (provider_id !== undefined) { updates.push('provider_id = ?'); values.push(provider_id || null); }
    if (currency !== undefined) { updates.push('currency = ?'); values.push(currency); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes || null); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    run(`UPDATE portfolio_assets SET ${updates.join(', ')} WHERE id = ?`, ...values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Asset update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/investments/assets?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  run('DELETE FROM portfolio_assets WHERE id = ?', Number(id));
  return NextResponse.json({ success: true });
}
