import { GoogleGenAI } from '@google/genai';
import type { ResearchContent, WatchlistItem } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const yahooFinance = require('yahoo-finance2').default;

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
  return new GoogleGenAI({ apiKey: key });
}

interface QuoteSnapshot {
  price: number | null;
  currency: string;
  marketCap: string;
  peRatio: string;
  eps: string;
  weekHigh52: string;
  weekLow52: string;
  avgVolume: string;
  dividendYield: string;
  beta: string;
}

interface HistoricalPoint {
  date: string;
  close: number;
}

async function fetchQuoteSnapshot(ticker: string): Promise<QuoteSnapshot | null> {
  try {
    const q = await yahooFinance.quote(ticker);
    if (!q) return null;
    const fmt = (v: number | undefined | null, suffix = '') =>
      v != null ? `${v}${suffix}` : 'N/A';
    const fmtLarge = (v: number | undefined | null) => {
      if (v == null) return 'N/A';
      if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
      if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
      return v.toLocaleString();
    };
    return {
      price: q.regularMarketPrice ?? null,
      currency: q.currency || 'USD',
      marketCap: fmtLarge(q.marketCap),
      peRatio: fmt(q.trailingPE),
      eps: fmt(q.epsTrailingTwelveMonths),
      weekHigh52: fmt(q.fiftyTwoWeekHigh),
      weekLow52: fmt(q.fiftyTwoWeekLow),
      avgVolume: fmtLarge(q.averageDailyVolume3Month),
      dividendYield: q.dividendYield != null ? `${(q.dividendYield * 100).toFixed(2)}%` : 'N/A',
      beta: fmt(q.beta),
    };
  } catch (e) {
    console.error(`[research] Failed to fetch quote for ${ticker}:`, e);
    return null;
  }
}

async function fetchPriceHistory(ticker: string, months: number): Promise<HistoricalPoint[]> {
  try {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const result = await yahooFinance.historical(ticker, {
      period1: start.toISOString().split('T')[0],
      period2: end.toISOString().split('T')[0],
      interval: '1wk',
    });
    return (result || []).map((r: { date: Date; close: number }) => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
      close: r.close,
    }));
  } catch (e) {
    console.error(`[research] Failed to fetch history for ${ticker}:`, e);
    return [];
  }
}

function buildPriceContext(quote: QuoteSnapshot | null, history: HistoricalPoint[]): string {
  if (!quote && history.length === 0) return '';

  const parts: string[] = ['\n\n--- REAL-TIME MARKET DATA (use this in your analysis) ---'];

  if (quote) {
    parts.push(`Current Price: ${quote.price} ${quote.currency}`);
    parts.push(`Market Cap: ${quote.marketCap}`);
    parts.push(`P/E Ratio (TTM): ${quote.peRatio}`);
    parts.push(`EPS (TTM): ${quote.eps}`);
    parts.push(`52-Week High: ${quote.weekHigh52}`);
    parts.push(`52-Week Low: ${quote.weekLow52}`);
    parts.push(`Avg Daily Volume (3M): ${quote.avgVolume}`);
    parts.push(`Dividend Yield: ${quote.dividendYield}`);
    parts.push(`Beta: ${quote.beta}`);
  }

  if (history.length >= 2) {
    const latest = history[history.length - 1];
    const calcChange = (idx: number) => {
      if (idx < 0 || idx >= history.length) return null;
      const old = history[idx].close;
      return ((latest.close - old) / old * 100).toFixed(2);
    };

    // Find points approximately 1 month, 3 months, 6 months, 12 months ago
    const weeksBack = (w: number) => Math.max(0, history.length - 1 - w);
    const chg1m = calcChange(weeksBack(4));
    const chg3m = calcChange(weeksBack(13));
    const chg6m = calcChange(weeksBack(26));
    const chg12m = calcChange(0);

    parts.push('');
    parts.push('Price Evolution:');
    if (chg1m) parts.push(`  1-month change: ${chg1m}%`);
    if (chg3m) parts.push(`  3-month change: ${chg3m}%`);
    if (chg6m) parts.push(`  6-month change: ${chg6m}%`);
    if (chg12m) parts.push(`  12-month change: ${chg12m}%`);

    // Weekly price series (sampled to keep prompt manageable)
    const sampled = history.length > 24
      ? history.filter((_, i) => i % Math.ceil(history.length / 24) === 0 || i === history.length - 1)
      : history;
    parts.push('');
    parts.push('Weekly closing prices (last 12 months, sampled):');
    for (const p of sampled) {
      parts.push(`  ${p.date}: ${p.close.toFixed(2)}`);
    }
  }

  parts.push('--- END MARKET DATA ---');
  return parts.join('\n');
}

export async function researchStock(item: WatchlistItem): Promise<{
  content: ResearchContent;
  sentiment: string;
  summary: string;
}> {
  const ai = getAI();

  console.log(`[research] Fetching live market data for ${item.ticker}...`);

  // Fetch Yahoo Finance data in parallel with Gemini web search
  const [quote, history, webResearch] = await Promise.all([
    fetchQuoteSnapshot(item.ticker),
    fetchPriceHistory(item.ticker, 12),
    fetchWebResearch(ai, item),
  ]);

  const priceContext = buildPriceContext(quote, history);

  console.log(`[research] Generating structured report for ${item.ticker}...`);

  // Step 2: Generate structured JSON report using all gathered data
  const reportPrompt = `You are a financial research analyst. Produce a comprehensive research report for ${item.name} (${item.ticker})${item.exchange ? ` listed on ${item.exchange}` : ''}.

--- UP-TO-DATE WEB RESEARCH (gathered moments ago via Google Search) ---
${webResearch}
--- END WEB RESEARCH ---
${priceContext}

CRITICAL INSTRUCTIONS:
- The web research above contains CURRENT, UP-TO-DATE information. Trust it over your training data. If the web research says a company is public, it IS public. If it mentions recent events (IPO, acquisitions, earnings), include them.
- Use the real-time market data (prices, P/E, etc.) to ground your financial analysis.
- Analyze the price trend using the price evolution data.

Return a JSON object with these exact fields. IMPORTANT: Every field value must be a plain text STRING (paragraphs of text), NOT an object or array.

- overview: (string) Company/asset overview, what they do, market position, recent news. Include the current stock price and key stats. Write 2-3 paragraphs as a single string.
- financials: (string) Key financial metrics using the real data provided (P/E, EPS, market cap, dividend yield), revenue trends, profitability, debt levels, valuations. Write as flowing prose paragraphs, not as key-value pairs.
- sentiment_analysis: (string) Current market sentiment, analyst ratings, price action analysis using the actual price evolution data (1m/3m/6m/12m changes), 52-week range position, momentum indicators. Write as prose paragraphs.
- opportunities: (string) Growth catalysts, competitive advantages, upcoming events that could drive value. Write as prose paragraphs.
- risks: (string) Key risks, competitive threats, regulatory concerns, macroeconomic headwinds. Write as prose paragraphs.
- recommendation: (string) Your overall assessment and recommendation in 1 paragraph. Include a fair value estimate if possible.
- sentiment: (string) Exactly one of: "bullish", "bearish", "neutral", or "mixed"
- summary: (string) One-sentence summary including the current price.

All values MUST be plain strings. Do NOT use nested objects or arrays for any field.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: reportPrompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '{}';
  console.log(`[research] Report response length: ${text.length} chars`);

  try {
    const parsed = JSON.parse(text);
    const str = (v: unknown): string =>
      typeof v === 'string' ? v : v ? JSON.stringify(v, null, 2) : '';
    return {
      content: {
        overview: str(parsed.overview),
        financials: str(parsed.financials),
        sentiment_analysis: str(parsed.sentiment_analysis),
        opportunities: str(parsed.opportunities),
        risks: str(parsed.risks),
        recommendation: str(parsed.recommendation),
      },
      sentiment: parsed.sentiment || 'neutral',
      summary: str(parsed.summary),
    };
  } catch (e) {
    console.error('[research] Failed to parse response:', e);
    throw new Error(`Failed to parse research response for ${item.ticker}`);
  }
}

/**
 * Step 1: Use Gemini with Google Search grounding to gather current info.
 * This can't use JSON mode, so we get free-text research back.
 */
async function fetchWebResearch(ai: GoogleGenAI, item: WatchlistItem): Promise<string> {
  try {
    console.log(`[research] Running Google Search grounded research for ${item.ticker}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research ${item.name} (ticker: ${item.ticker})${item.exchange ? ` on ${item.exchange}` : ''}. Search for the LATEST information available.

Provide a detailed research briefing covering:
1. Company status: Is it public or private? When did it IPO (if applicable)? What exchange does it trade on?
2. Latest news: Any recent major events (earnings reports, acquisitions, product launches, leadership changes, IPO, regulatory actions) from the last 6 months.
3. Current analyst consensus: Buy/sell/hold ratings, price targets.
4. Recent financial performance: Latest quarterly earnings, revenue growth, profitability trends.
5. Competitive landscape: Key competitors and market position.
6. Industry trends: Relevant sector developments affecting this company.

Be specific with dates, numbers, and sources. This is a research briefing, not a recommendation.`,
      config: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text?.trim() || '';
    console.log(`[research] Web research length: ${text.length} chars`);
    return text || 'No web research available.';
  } catch (e) {
    console.error(`[research] Google Search grounding failed for ${item.ticker}:`, e);
    return 'Web research unavailable — using training data only.';
  }
}
