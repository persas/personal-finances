/**
 * SEC EDGAR API wrapper — fetches latest filings for a given ticker.
 * The EDGAR API is free and public. Requires a User-Agent header.
 * See: https://www.sec.gov/edgar/searchedgar/companysearch
 */

export interface SECFiling {
  type: string;          // e.g. "10-K", "10-Q", "8-K"
  date: string;          // Filing date (YYYY-MM-DD)
  description: string;   // Filing description
  url: string;           // Link to the filing on SEC.gov
  accessionNumber: string;
}

const SEC_USER_AGENT = 'PersonalFinancesApp/1.0 (research@example.com)';

const FILING_TYPES_OF_INTEREST = new Set([
  '10-K', '10-Q', '8-K', '20-F', '6-K',       // Annual, quarterly, current reports
  'S-1', 'S-1/A',                                // IPO registration
  'DEF 14A', 'DEFA14A',                          // Proxy statements
  '13F-HR',                                      // Institutional holdings
  'SC 13D', 'SC 13D/A', 'SC 13G', 'SC 13G/A',   // Activist/institutional ownership
  '4',                                            // Insider transactions
]);

/**
 * Look up CIK number from ticker using SEC company tickers JSON.
 */
async function lookupCIK(ticker: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });
    if (!res.ok) return null;

    const data = await res.json() as Record<string, { cik_str: number; ticker: string; title: string }>;
    const upperTicker = ticker.toUpperCase();

    for (const entry of Object.values(data)) {
      if (entry.ticker === upperTicker) {
        return String(entry.cik_str);
      }
    }
    return null;
  } catch (e) {
    console.error(`[sec] Failed to look up CIK for ${ticker}:`, e);
    return null;
  }
}

/**
 * Fetch recent SEC filings for a ticker.
 * Returns the most recent filings of interest (10-K, 10-Q, 8-K, etc.).
 */
export async function fetchSECFilings(rawTicker: string, limit = 15): Promise<SECFiling[] | null> {
  const ticker = rawTicker.includes(':')
    ? rawTicker.split(':').pop()!.trim()
    : rawTicker.trim();

  try {
    const cik = await lookupCIK(ticker);
    if (!cik) {
      console.log(`[sec] No CIK found for ${ticker} — may not be a US-listed company`);
      return null;
    }

    const paddedCIK = cik.padStart(10, '0');
    const url = `https://data.sec.gov/submissions/CIK${paddedCIK}.json`;

    const res = await fetch(url, {
      headers: { 'User-Agent': SEC_USER_AGENT },
    });
    if (!res.ok) {
      console.error(`[sec] EDGAR submissions returned ${res.status} for CIK ${cik}`);
      return null;
    }

    const data = await res.json() as {
      cik: string;
      name: string;
      filings: {
        recent: {
          accessionNumber: string[];
          filingDate: string[];
          form: string[];
          primaryDocument: string[];
          primaryDocDescription: string[];
        };
      };
    };

    const recent = data.filings.recent;
    const filings: SECFiling[] = [];

    for (let i = 0; i < recent.form.length && filings.length < limit; i++) {
      const form = recent.form[i];
      if (!FILING_TYPES_OF_INTEREST.has(form)) continue;

      const accession = recent.accessionNumber[i];
      const accessionClean = accession.replace(/-/g, '');
      const primaryDoc = recent.primaryDocument[i];

      filings.push({
        type: form,
        date: recent.filingDate[i],
        description: recent.primaryDocDescription[i] || form,
        url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionClean}/${primaryDoc}`,
        accessionNumber: accession,
      });
    }

    console.log(`[sec] Found ${filings.length} recent filings for ${ticker} (CIK: ${cik})`);
    return filings;
  } catch (e) {
    console.error(`[sec] Failed to fetch filings for ${ticker}:`, e);
    return null;
  }
}
