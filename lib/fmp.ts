const BASE_URL = 'https://financialmodelingprep.com/stable';

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error('FMP_API_KEY environment variable is not set');
  return key;
}

async function fmpGet<T>(path: string): Promise<T | null> {
  try {
    const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}apikey=${getApiKey()}`;
    const res = await fetch(url);
    if (!res.ok) {
      // FMP returns 403 for symbols outside free tier — this is expected
      if (res.status === 403) {
        console.log(`[fmp] ${path} — symbol not in free tier coverage`);
      } else {
        console.error(`[fmp] ${path} returned ${res.status}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[fmp] ${path} failed:`, e);
    return null;
  }
}

// --- Response types (matching FMP /stable/ API field names) ---

export interface FMPIncomeStatement {
  date: string;
  fiscalYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  ebitda: number;
}

export interface FMPBalanceSheet {
  date: string;
  fiscalYear: string;
  period: string;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalDebt: number;
  cashAndCashEquivalents: number;
  netDebt: number;
  longTermDebt: number;
}

export interface FMPCashFlow {
  date: string;
  fiscalYear: string;
  period: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  commonDividendsPaid: number;
  netCashProvidedByOperatingActivities: number;
}

export interface FMPKeyMetric {
  date: string;
  fiscalYear: string;
  period: string;
  evToEBITDA: number;
  returnOnInvestedCapital: number;
  returnOnEquity: number;
  returnOnAssets: number;
  freeCashFlowYield: number;
  currentRatio: number;
  earningsYield: number;
}

export interface FMPRatio {
  date: string;
  fiscalYear: string;
  period: string;
}

// --- Fetch functions ---

export async function fetchIncomeStatements(symbol: string, limit = 4): Promise<FMPIncomeStatement[] | null> {
  return fmpGet<FMPIncomeStatement[]>(`/income-statement?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
}

export async function fetchBalanceSheets(symbol: string, limit = 4): Promise<FMPBalanceSheet[] | null> {
  return fmpGet<FMPBalanceSheet[]>(`/balance-sheet-statement?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
}

export async function fetchCashFlows(symbol: string, limit = 4): Promise<FMPCashFlow[] | null> {
  return fmpGet<FMPCashFlow[]>(`/cash-flow-statement?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
}

export async function fetchKeyMetrics(symbol: string, limit = 4): Promise<FMPKeyMetric[] | null> {
  return fmpGet<FMPKeyMetric[]>(`/key-metrics?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
}

export async function fetchRatios(symbol: string, limit = 4): Promise<FMPRatio[] | null> {
  return fmpGet<FMPRatio[]>(`/ratios?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
}
