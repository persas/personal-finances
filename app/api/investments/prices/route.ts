import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import { fetchStockPrices, fetchCryptoPrices } from '@/lib/prices';
import type { PortfolioAsset, AssetPrice } from '@/lib/types';

// GET /api/investments/prices?assetId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('assetId');
  const days = Number(searchParams.get('days') || '90');

  if (!assetId) {
    return NextResponse.json({ error: 'assetId required' }, { status: 400 });
  }

  const prices = query<AssetPrice>(
    `SELECT * FROM asset_prices
     WHERE asset_id = ? AND date >= date('now', '-' || ? || ' days')
     ORDER BY date ASC`,
    Number(assetId), days
  );

  return NextResponse.json({ prices });
}

// POST /api/investments/prices
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'manual') {
      return handleManualPrice(body);
    }
    if (action === 'update') {
      return handleAutoUpdate(body);
    }

    return NextResponse.json({ error: 'Invalid action. Use "manual" or "update".' }, { status: 400 });
  } catch (error) {
    console.error('Price error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process price request' },
      { status: 500 }
    );
  }
}

async function handleManualPrice(body: {
  asset_id: number;
  price: number;
  date: string;
}) {
  const { asset_id, price, date } = body;
  if (!asset_id || price == null || !date) {
    return NextResponse.json({ error: 'asset_id, price, and date required' }, { status: 400 });
  }

  run(
    `INSERT OR REPLACE INTO asset_prices (asset_id, price, date, source)
     VALUES (?, ?, ?, 'manual')`,
    asset_id, price, date
  );

  return NextResponse.json({ success: true });
}

async function handleAutoUpdate(body: { profileId: string }) {
  const { profileId } = body;
  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const assets = query<PortfolioAsset>(
    'SELECT * FROM portfolio_assets WHERE profile_id = ? AND is_public = 1',
    profileId
  );

  if (assets.length === 0) {
    return NextResponse.json({ updated: 0, errors: [] });
  }

  const today = new Date().toISOString().split('T')[0];
  let updated = 0;
  const errors: string[] = [];

  // Group by type
  const stockTickers: { id: number; ticker: string }[] = [];
  const cryptoAssets: { id: number; providerId: string }[] = [];

  for (const asset of assets) {
    if (!asset.ticker) continue;
    if (asset.asset_type === 'crypto') {
      if (asset.provider_id) {
        cryptoAssets.push({ id: asset.id, providerId: asset.provider_id });
      } else {
        errors.push(`${asset.name}: No CoinGecko ID configured`);
      }
    } else {
      stockTickers.push({ id: asset.id, ticker: asset.ticker });
    }
  }

  // Fetch stock prices
  if (stockTickers.length > 0) {
    const tickers = stockTickers.map(s => s.ticker);
    const prices = await fetchStockPrices(tickers);
    for (const { id, ticker } of stockTickers) {
      const price = prices.get(ticker);
      if (price != null) {
        run(
          `INSERT OR REPLACE INTO asset_prices (asset_id, price, date, source)
           VALUES (?, ?, ?, 'yahoo')`,
          id, price, today
        );
        updated++;
      } else {
        errors.push(`${ticker}: Price not available`);
      }
    }
  }

  // Fetch crypto prices
  if (cryptoAssets.length > 0) {
    const coinIds = cryptoAssets.map(c => c.providerId);
    const prices = await fetchCryptoPrices(coinIds);
    for (const { id, providerId } of cryptoAssets) {
      const price = prices.get(providerId);
      if (price != null) {
        run(
          `INSERT OR REPLACE INTO asset_prices (asset_id, price, date, source)
           VALUES (?, ?, ?, 'coingecko')`,
          id, price, today
        );
        updated++;
      } else {
        errors.push(`${providerId}: Price not available`);
      }
    }
  }

  return NextResponse.json({ updated, errors });
}
