import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseAndCategorizeCSV } from '@/lib/gemini';
import type { BudgetLine } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { profileId, csvText, year } = await req.json();
    console.log(`[parse-csv] Request: profileId=${profileId}, csvLength=${csvText?.length}, year=${year}`);

    if (!profileId || !csvText) {
      return NextResponse.json(
        { error: 'profileId and csvText are required' },
        { status: 400 }
      );
    }

    // Fetch budget lines for context
    const budgetLines = query<BudgetLine>(
      `SELECT * FROM budget_lines WHERE profile_id = ? AND year = ?`,
      profileId,
      year || new Date().getFullYear()
    );
    console.log(`[parse-csv] Found ${budgetLines.length} budget lines for ${profileId}`);

    // Get profile name
    const profiles = query<{ name: string }>(
      `SELECT name FROM profiles WHERE id = ?`,
      profileId
    );
    const profileName = profiles[0]?.name || profileId;
    console.log(`[parse-csv] Profile name: ${profileName}`);

    // Call Gemini to parse and categorize
    console.log(`[parse-csv] Calling Gemini...`);
    const transactions = await parseAndCategorizeCSV(csvText, budgetLines, profileName);
    console.log(`[parse-csv] Gemini returned ${transactions.length} transactions`);

    // Return ALL transactions — no month filtering at parse stage.
    // Filtering happens at the dashboard/display level.
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[parse-csv] ERROR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CSV' },
      { status: 500 }
    );
  }
}
