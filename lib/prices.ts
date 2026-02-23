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
