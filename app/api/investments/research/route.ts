import { NextRequest, NextResponse } from 'next/server';
import { query, run, get } from '@/lib/db';
import { researchStock } from '@/lib/research';
import type { WatchlistItem, ResearchReport, ResearchContent } from '@/lib/types';

// GET /api/investments/research?watchlistId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const watchlistId = searchParams.get('watchlistId');

  if (!watchlistId) {
    return NextResponse.json({ error: 'watchlistId required' }, { status: 400 });
  }

  const rows = query<{
    id: number;
    watchlist_id: number;
    research_date: string;
    content: string;
    sentiment: string | null;
    summary: string | null;
    model_used: string;
  }>(
    'SELECT * FROM research_reports WHERE watchlist_id = ? ORDER BY research_date DESC',
    Number(watchlistId)
  );

  const reports: ResearchReport[] = rows.map(row => ({
    ...row,
    content: JSON.parse(row.content) as ResearchContent,
    sentiment: row.sentiment as ResearchReport['sentiment'],
  }));

  return NextResponse.json({ reports });
}

// POST /api/investments/research — trigger new research
export async function POST(req: NextRequest) {
  try {
    const { watchlistId } = await req.json();

    if (!watchlistId) {
      return NextResponse.json({ error: 'watchlistId required' }, { status: 400 });
    }

    const item = get<WatchlistItem>(
      'SELECT * FROM watchlist WHERE id = ?',
      watchlistId
    );

    if (!item) {
      return NextResponse.json({ error: 'Watchlist item not found' }, { status: 404 });
    }

    const result = await researchStock(item);

    run(
      `INSERT INTO research_reports (watchlist_id, content, sentiment, summary)
       VALUES (?, ?, ?, ?)`,
      watchlistId,
      JSON.stringify(result.content),
      result.sentiment,
      result.summary
    );

    const report: ResearchReport = {
      id: 0, // will be set by DB
      watchlist_id: watchlistId,
      research_date: new Date().toISOString(),
      content: result.content,
      sentiment: result.sentiment as ResearchReport['sentiment'],
      summary: result.summary,
      model_used: 'gemini-2.5-pro',
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    );
  }
}
