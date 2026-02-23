const BASE_URL = 'https://finnhub.io/api/v1';

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY environment variable is not set');
  return key;
}

async function fhGet<T>(path: string): Promise<T | null> {
  try {
    const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${getApiKey()}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[finnhub] ${path} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[finnhub] ${path} failed:`, e);
    return null;
  }
}

// --- Response types ---

export interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

export interface FinnhubMetrics {
  metric: Record<string, number | null>;
  metricType: string;
  symbol: string;
}

export interface FinnhubRecommendation {
  buy: number;
  hold: number;
  period: string;
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
}

export interface FinnhubPriceTarget {
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface FinnhubEarning {
  actual: number | null;
  estimate: number | null;
  period: string;
  quarter: number;
  surprise: number | null;
  surprisePercent: number | null;
  symbol: string;
  year: number;
}

export interface FinnhubCandle {
  c: number[]; // close
  h: number[]; // high
  l: number[]; // low
  o: number[]; // open
  s: string;   // status
  t: number[]; // timestamp (unix)
  v: number[]; // volume
}

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high of the day
  l: number;  // low of the day
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

// --- Fetch functions ---

export async function fetchProfile(symbol: string): Promise<FinnhubProfile | null> {
  return fhGet<FinnhubProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchMetrics(symbol: string): Promise<FinnhubMetrics | null> {
  return fhGet<FinnhubMetrics>(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`);
}

export async function fetchRecommendations(symbol: string): Promise<FinnhubRecommendation[] | null> {
  return fhGet<FinnhubRecommendation[]>(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchPriceTarget(symbol: string): Promise<FinnhubPriceTarget | null> {
  // Finnhub price target is premium — fall back to FMP
  const fmpKey = process.env.FMP_API_KEY;
  if (!fmpKey) return null;
  try {
    const url = `https://financialmodelingprep.com/stable/price-target-consensus?symbol=${encodeURIComponent(symbol)}&apikey=${fmpKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const item = Array.isArray(data) ? data[0] : data;
    if (!item?.targetConsensus) return null;
    return {
      targetHigh: item.targetHigh,
      targetLow: item.targetLow,
      targetMean: item.targetConsensus,
      targetMedian: item.targetMedian,
    };
  } catch {
    return null;
  }
}

export async function fetchEarnings(symbol: string): Promise<FinnhubEarning[] | null> {
  return fhGet<FinnhubEarning[]>(`/stock/earnings?symbol=${encodeURIComponent(symbol)}&limit=12`);
}

/**
 * Fetch weekly price history. Finnhub candles are premium,
 * so we use Yahoo Finance's public chart API as a free alternative.
 */
export async function fetchCandle(
  symbol: string,
  _resolution: 'D' | 'W' | 'M',
  _fromDate: Date,
  _toDate: Date,
): Promise<FinnhubCandle | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1wk`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) {
      console.error(`[yahoo-chart] ${symbol} returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) return null;

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators.quote[0].close;

    // Filter out null values
    const c: number[] = [];
    const t: number[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        c.push(closes[i] as number);
        t.push(timestamps[i]);
      }
    }

    if (c.length === 0) return null;

    return {
      c,
      h: c, // approximate — we only need closes for chart
      l: c,
      o: c,
      s: 'ok',
      t,
      v: [],
    };
  } catch (e) {
    console.error(`[yahoo-chart] ${symbol} failed:`, e);
    return null;
  }
}

export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  return fhGet<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`);
}

export async function fetchPeers(symbol: string): Promise<string[] | null> {
  return fhGet<string[]>(`/stock/peers?symbol=${encodeURIComponent(symbol)}`);
}
