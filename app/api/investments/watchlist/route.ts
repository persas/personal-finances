import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/db';
import type { WatchlistItem, ResearchReport, ResearchContent } from '@/lib/types';

interface WatchlistRow {
  id: number;
  profile_id: string;
  ticker: string;
  name: string;
  asset_type: string;
  exchange: string | null;
  added_at: string;
  report_id: number | null;
  research_date: string | null;
  content: string | null;
  sentiment: string | null;
  summary: string | null;
  model_used: string | null;
}

// GET /api/investments/watchlist?profileId=diego
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  const rows = query<WatchlistRow>(
    `SELECT w.*,
      r.id as report_id, r.research_date, r.content, r.sentiment, r.summary, r.model_used
    FROM watchlist w
    LEFT JOIN (
      SELECT rr.*,
        ROW_NUMBER() OVER (PARTITION BY rr.watchlist_id ORDER BY rr.research_date DESC) as rn
      FROM research_reports rr
    ) r ON w.id = r.watchlist_id AND r.rn = 1
    WHERE w.profile_id = ?
    ORDER BY w.added_at DESC`,
    profileId
  );

  const items: WatchlistItem[] = rows.map(row => ({
    id: row.id,
    profile_id: row.profile_id,
    ticker: row.ticker,
    name: row.name,
    asset_type: row.asset_type as WatchlistItem['asset_type'],
    exchange: row.exchange,
    added_at: row.added_at,
    latestReport: row.report_id ? {
      id: row.report_id,
      watchlist_id: row.id,
      research_date: row.research_date!,
      content: JSON.parse(row.content || '{}') as ResearchContent,
      sentiment: row.sentiment as ResearchReport['sentiment'],
      summary: row.summary,
      model_used: row.model_used || 'gemini-2.5-pro',
    } : null,
  }));

  return NextResponse.json({ items });
}

// POST /api/investments/watchlist
export async function POST(req: NextRequest) {
  try {
    const { profile_id, ticker, name, asset_type, exchange } = await req.json();

    if (!profile_id || !ticker || !name) {
      return NextResponse.json({ error: 'profile_id, ticker, and name required' }, { status: 400 });
    }

    const result = run(
      `INSERT INTO watchlist (profile_id, ticker, name, asset_type, exchange)
       VALUES (?, ?, ?, ?, ?)`,
      profile_id, ticker.toUpperCase(), name, asset_type || 'stock', exchange || null
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Watchlist add error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to add to watchlist';
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'This ticker is already in your watchlist' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/investments/watchlist?id=1
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  run('DELETE FROM watchlist WHERE id = ?', Number(id));
  return NextResponse.json({ success: true });
}
