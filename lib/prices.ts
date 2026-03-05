import { fetchQuote } from './finnhub';

function cleanTicker(ticker: string): string {
  const colonIdx = ticker.indexOf(':');
  return colonIdx >= 0 ? ticker.slice(colonIdx + 1).trim() : ticker.trim();
}

export async function fetchStockPrices(
  tickers: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  for (const ticker of tickers) {
    try {
      const quote = await fetchQuote(cleanTicker(ticker));
      if (quote && quote.c > 0) {
        results.set(ticker, quote.c);
      }
    } catch (e) {
      console.error(`[prices] Failed to fetch ${ticker}:`, e);
    }
  }
  return results;
}

async function fetchYahooFundPrice(symbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice ?? meta?.previousClose;
  return price != null && price > 0 ? price : null;
}

export async function fetchFundPrices(
  tickers: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  for (const ticker of tickers) {
    try {
      // Try ticker as-is first, then with .F suffix (needed for Morningstar fund IDs)
      let price = await fetchYahooFundPrice(ticker);
      if (price == null && !ticker.includes('.')) {
        price = await fetchYahooFundPrice(`${ticker}.F`);
      }
      if (price != null) {
        results.set(ticker, price);
      }
    } catch (e) {
      console.error(`[yahoo-fund] ${ticker} failed:`, e);
    }
  }
  return results;
}

export async function fetchCryptoPrices(
  coinIds: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  if (coinIds.length === 0) return results;

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=eur`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    for (const [id, prices] of Object.entries(data)) {
      const eurPrice = (prices as { eur: number }).eur;
      if (eurPrice != null) {
        results.set(id, eurPrice);
      }
    }
  } catch (e) {
    console.error('[prices] CoinGecko error:', e);
  }
  return results;
}
