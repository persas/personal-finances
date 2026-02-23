import { GoogleGenAI } from '@google/genai';
import type { ResearchContent, WatchlistItem } from './types';
import {
  fetchProfile, fetchMetrics, fetchRecommendations,
  fetchPriceTarget, fetchEarnings, fetchCandle, fetchQuote, fetchPeers,
  type FinnhubProfile, type FinnhubMetrics, type FinnhubRecommendation,
  type FinnhubPriceTarget, type FinnhubEarning, type FinnhubCandle, type FinnhubQuote,
} from './finnhub';
import {
  fetchIncomeStatements, fetchBalanceSheets, fetchCashFlows,
  fetchKeyMetrics, fetchRatios,
  type FMPIncomeStatement, type FMPBalanceSheet, type FMPCashFlow,
  type FMPKeyMetric, type FMPRatio,
} from './fmp';

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Strip exchange prefix from ticker (e.g., "NASDAQ: MSFT" → "MSFT")
 */
function cleanTicker(ticker: string): string {
  const colonIdx = ticker.indexOf(':');
  return colonIdx >= 0 ? ticker.slice(colonIdx + 1).trim() : ticker.trim();
}

// --- Comprehensive data from Finnhub + FMP ---

interface ComprehensiveData {
  profile: FinnhubProfile | null;
  metrics: FinnhubMetrics | null;
  recommendations: FinnhubRecommendation[] | null;
  priceTarget: FinnhubPriceTarget | null;
  earnings: FinnhubEarning[] | null;
  candle: FinnhubCandle | null;
  quote: FinnhubQuote | null;
  peers: string[] | null;
  // FMP (nullable — not available for all symbols)
  incomeStatements: FMPIncomeStatement[] | null;
  balanceSheets: FMPBalanceSheet[] | null;
  cashFlows: FMPCashFlow[] | null;
  keyMetrics: FMPKeyMetric[] | null;
  ratios: FMPRatio[] | null;
}

async function fetchComprehensiveData(rawTicker: string): Promise<ComprehensiveData> {
  const ticker = cleanTicker(rawTicker);
  console.log(`[research] Fetching comprehensive data for ${ticker}...`);

  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Fetch all data in parallel — Finnhub + FMP
  const [
    profile, metrics, recommendations, priceTarget,
    earnings, candle, quote, peers,
    incomeStatements, balanceSheets, cashFlows, keyMetrics, ratios,
  ] = await Promise.all([
    // Finnhub calls
    fetchProfile(ticker),
    fetchMetrics(ticker),
    fetchRecommendations(ticker),
    fetchPriceTarget(ticker),
    fetchEarnings(ticker),
    fetchCandle(ticker, 'W', oneYearAgo, now),
    fetchQuote(ticker),
    fetchPeers(ticker),
    // FMP calls (graceful fallback for non-covered symbols)
    fetchIncomeStatements(ticker),
    fetchBalanceSheets(ticker),
    fetchCashFlows(ticker),
    fetchKeyMetrics(ticker),
    fetchRatios(ticker),
  ]);

  console.log(`[research] Data fetched — profile: ${!!profile}, metrics: ${!!metrics}, FMP income: ${!!incomeStatements}`);

  return {
    profile, metrics, recommendations, priceTarget,
    earnings, candle, quote, peers,
    incomeStatements, balanceSheets, cashFlows, keyMetrics, ratios,
  };
}

// --- Build structured context for Gemini ---

function m(key: string, data: FinnhubMetrics | null): number | null {
  return data?.metric?.[key] ?? null;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return 'N/A';
  if (Math.abs(v) >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function pct(v: number | null | undefined): string {
  // Finnhub returns metrics already in percentage form (e.g., 68.59 = 68.59%)
  if (v == null) return 'N/A';
  return `${v.toFixed(2)}%`;
}

function buildAnalysisContext(data: ComprehensiveData): string {
  const parts: string[] = [];

  // Company Profile
  if (data.profile) {
    const p = data.profile;
    parts.push('--- COMPANY PROFILE ---');
    parts.push(`Name: ${p.name} | Ticker: ${p.ticker}`);
    parts.push(`Industry: ${p.finnhubIndustry} | Country: ${p.country}`);
    parts.push(`Exchange: ${p.exchange} | IPO Date: ${p.ipo}`);
    parts.push(`Market Cap: ${fmtNum(p.marketCapitalization * 1e6)} | Shares Outstanding: ${fmtNum(p.shareOutstanding * 1e6)}`);
    parts.push(`Website: ${p.weburl}`);
    parts.push('');
  }

  // Current Quote
  if (data.quote && data.quote.c > 0) {
    parts.push('--- CURRENT QUOTE ---');
    parts.push(`Price: $${data.quote.c.toFixed(2)} | Change: ${data.quote.d?.toFixed(2)} (${data.quote.dp?.toFixed(2)}%)`);
    parts.push(`Day Range: $${data.quote.l} - $${data.quote.h} | Previous Close: $${data.quote.pc}`);
    parts.push('');
  }

  // Key Metrics from Finnhub
  if (data.metrics) {
    const met = data.metrics;
    parts.push('--- VALUATION METRICS ---');
    parts.push(`P/E (TTM): ${fmtNum(m('peTTM', met))} | Forward P/E: ${fmtNum(m('forwardPE', met))}`);
    parts.push(`PEG Ratio: ${fmtNum(m('pegTTM', met))}`);
    parts.push(`P/B: ${fmtNum(m('pbQuarterly', met) ?? m('pbAnnual', met))}`);
    parts.push(`P/S (TTM): ${fmtNum(m('psTTM', met))} | EV/EBITDA: ${fmtNum(m('evEbitdaTTM', met))}`);
    parts.push(`Price/Cash Flow: ${fmtNum(m('pcfShareTTM', met))}`);
    parts.push('');

    parts.push('--- PROFITABILITY ---');
    parts.push(`Gross Margin (TTM): ${pct(m('grossMarginTTM', met))} | 5Y Avg: ${pct(m('grossMargin5Y', met))}`);
    parts.push(`Operating Margin (TTM): ${pct(m('operatingMarginTTM', met))} | 5Y Avg: ${pct(m('operatingMargin5Y', met))}`);
    parts.push(`Net Margin (TTM): ${pct(m('netProfitMarginTTM', met))} | 5Y Avg: ${pct(m('netProfitMargin5Y', met))}`);
    parts.push(`ROE (TTM): ${pct(m('roeTTM', met))} | ROA (TTM): ${pct(m('roaTTM', met))} | ROI (TTM): ${pct(m('roiTTM', met))}`);
    parts.push('');

    parts.push('--- GROWTH ---');
    parts.push(`Revenue Growth (Quarterly YoY): ${pct(m('revenueGrowthQuarterlyYoy', met))} | 3Y CAGR: ${pct(m('revenueGrowth3Y', met))} | 5Y CAGR: ${pct(m('revenueGrowth5Y', met))}`);
    parts.push(`EPS Growth (TTM YoY): ${pct(m('epsGrowthTTMYoy', met))} | 3Y CAGR: ${pct(m('epsGrowth3Y', met))} | 5Y CAGR: ${pct(m('epsGrowth5Y', met))}`);
    parts.push(`EPS (TTM): ${fmtNum(m('epsTTM', met))} | EPS (Annual): ${fmtNum(m('epsAnnual', met))}`);
    parts.push('');

    parts.push('--- BALANCE SHEET & CASH FLOW ---');
    parts.push(`Long-Term Debt/Equity: ${fmtNum(m('longTermDebt/equityQuarterly', met))}`);
    parts.push(`Current Ratio: ${fmtNum(m('currentRatioQuarterly', met))}`);
    parts.push(`FCF/Share (TTM): ${fmtNum(m('freeCashFlowPerShareTTM', met))}`);
    parts.push(`Book Value/Share: ${fmtNum(m('bookValuePerShareQuarterly', met))}`);
    parts.push(`Dividend Yield: ${pct(m('dividendYieldIndicatedAnnual', met))}`);
    parts.push(`Beta: ${fmtNum(m('beta', met))}`);
    parts.push('');

    parts.push('--- PRICE PERFORMANCE ---');
    parts.push(`52-Week High: $${fmtNum(m('52WeekHigh', met))} | 52-Week Low: $${fmtNum(m('52WeekLow', met))}`);
    parts.push(`3M Return: ${pct(m('13WeekPriceReturnDaily', met))} | 6M Return: ${pct(m('26WeekPriceReturnDaily', met))} | 1Y Return: ${pct(m('52WeekPriceReturnDaily', met))}`);
    parts.push('');
  }

  // FMP Financial Statements
  if (data.incomeStatements && data.incomeStatements.length > 0) {
    parts.push('--- ANNUAL INCOME STATEMENTS ---');
    for (const stmt of data.incomeStatements.slice(0, 4)) {
      const grossPct = stmt.revenue > 0 ? ((stmt.grossProfit / stmt.revenue) * 100).toFixed(1) + '%' : 'N/A';
      const opPct = stmt.revenue > 0 ? ((stmt.operatingIncome / stmt.revenue) * 100).toFixed(1) + '%' : 'N/A';
      const netPct = stmt.revenue > 0 ? ((stmt.netIncome / stmt.revenue) * 100).toFixed(1) + '%' : 'N/A';
      parts.push(`FY${stmt.fiscalYear}: Revenue ${fmtNum(stmt.revenue)} | Gross Profit ${fmtNum(stmt.grossProfit)} (${grossPct}) | Operating Income ${fmtNum(stmt.operatingIncome)} (${opPct}) | Net Income ${fmtNum(stmt.netIncome)} (${netPct}) | EPS ${stmt.epsDiluted?.toFixed(2)}`);
    }
    parts.push('');
  }

  if (data.cashFlows && data.cashFlows.length > 0) {
    parts.push('--- ANNUAL CASH FLOW ---');
    for (const stmt of data.cashFlows.slice(0, 4)) {
      parts.push(`FY${stmt.fiscalYear}: Operating CF ${fmtNum(stmt.operatingCashFlow)} | CapEx ${fmtNum(stmt.capitalExpenditure)} | Free CF ${fmtNum(stmt.freeCashFlow)} | Dividends Paid ${fmtNum(stmt.commonDividendsPaid)}`);
    }
    parts.push('');
  }

  if (data.balanceSheets && data.balanceSheets.length > 0) {
    parts.push('--- ANNUAL BALANCE SHEET ---');
    for (const stmt of data.balanceSheets.slice(0, 4)) {
      parts.push(`FY${stmt.fiscalYear}: Total Assets ${fmtNum(stmt.totalAssets)} | Total Debt ${fmtNum(stmt.totalDebt)} | Cash ${fmtNum(stmt.cashAndCashEquivalents)} | Net Debt ${fmtNum(stmt.netDebt)} | Equity ${fmtNum(stmt.totalStockholdersEquity)}`);
    }
    parts.push('');
  }

  // Analyst Data
  if (data.priceTarget) {
    parts.push('--- ANALYST PRICE TARGETS ---');
    parts.push(`Mean: $${data.priceTarget.targetMean} | Median: $${data.priceTarget.targetMedian} | High: $${data.priceTarget.targetHigh} | Low: $${data.priceTarget.targetLow}`);
    parts.push('');
  }

  if (data.recommendations && data.recommendations.length > 0) {
    parts.push('--- ANALYST RECOMMENDATIONS (last 4 months) ---');
    for (const rec of data.recommendations.slice(0, 4)) {
      parts.push(`${rec.period}: Strong Buy ${rec.strongBuy} | Buy ${rec.buy} | Hold ${rec.hold} | Sell ${rec.sell} | Strong Sell ${rec.strongSell}`);
    }
    parts.push('');
  }

  // Earnings History
  if (data.earnings && data.earnings.length > 0) {
    parts.push('--- QUARTERLY EARNINGS (last 8) ---');
    for (const e of data.earnings.slice(0, 8)) {
      const surprise = e.surprisePercent != null ? ` (surprise ${e.surprisePercent > 0 ? '+' : ''}${e.surprisePercent.toFixed(1)}%)` : '';
      parts.push(`Q${e.quarter} ${e.year}: Actual $${e.actual?.toFixed(2) ?? 'N/A'} vs Est $${e.estimate?.toFixed(2) ?? 'N/A'}${surprise}`);
    }
    parts.push('');
  }

  // Peers
  if (data.peers && data.peers.length > 0) {
    parts.push(`--- PEERS ---`);
    parts.push(data.peers.slice(0, 10).join(', '));
    parts.push('');
  }

  // Price History
  if (data.candle && data.candle.s === 'ok' && data.candle.c.length > 0) {
    const prices = data.candle.c;
    const timestamps = data.candle.t;
    // Sample to ~24 points
    const step = Math.max(1, Math.ceil(prices.length / 24));
    parts.push('--- WEEKLY PRICE HISTORY (12 months, sampled) ---');
    for (let i = 0; i < prices.length; i += step) {
      const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
      parts.push(`  ${date}: $${prices[i].toFixed(2)}`);
    }
    // Always include the latest point
    const last = prices.length - 1;
    if (last % step !== 0) {
      const date = new Date(timestamps[last] * 1000).toISOString().split('T')[0];
      parts.push(`  ${date}: $${prices[last].toFixed(2)}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

// --- Assemble the ResearchContent from API data + AI output ---

function buildMetrics(data: ComprehensiveData): ResearchContent['metrics'] {
  const met = data.metrics;
  const price = data.quote?.c ?? null;
  // Finnhub marketCapitalization is in millions
  const marketCap = data.profile ? data.profile.marketCapitalization * 1e6 : null;
  // Finnhub enterpriseValue is also in millions
  const enterpriseValue = m('enterpriseValue', met) != null ? m('enterpriseValue', met)! * 1e6 : null;

  // Try to get FCF from FMP cash flow statements (most recent year)
  const latestCF = data.cashFlows?.[0];
  const freeCashflow = latestCF?.freeCashFlow ?? null;
  const operatingCashflow = latestCF?.operatingCashFlow ?? null;
  const fcfYield = (freeCashflow != null && marketCap != null && marketCap > 0)
    ? freeCashflow / marketCap : null;

  // Balance sheet data from FMP
  const latestBS = data.balanceSheets?.[0];

  // Latest FMP key metrics for values Finnhub doesn't have
  const latestKM = data.keyMetrics?.[0];

  // Finnhub margins/growth/returns are in percentage form (e.g., 68.59 = 68.59%)
  // Convert to decimal (0-1) for consistent internal representation
  const pctToDec = (v: number | null): number | null => v != null ? v / 100 : null;

  return {
    price,
    currency: data.profile?.currency ?? 'USD',
    marketCap,
    enterpriseValue,
    trailingPE: m('peTTM', met),
    forwardPE: m('forwardPE', met),
    pegRatio: m('pegTTM', met),
    priceToBook: m('pbQuarterly', met) ?? m('pbAnnual', met),
    evToEbitda: m('evEbitdaTTM', met) ?? latestKM?.evToEBITDA ?? null,
    priceToSales: m('psTTM', met),
    priceToCashFlow: m('pcfShareTTM', met),
    grossMargin: pctToDec(m('grossMarginTTM', met)),
    operatingMargin: pctToDec(m('operatingMarginTTM', met)),
    netMargin: pctToDec(m('netProfitMarginTTM', met)),
    returnOnEquity: pctToDec(m('roeTTM', met)),
    returnOnAssets: pctToDec(m('roaTTM', met)),
    roic: latestKM?.returnOnInvestedCapital != null ? latestKM.returnOnInvestedCapital : pctToDec(m('roiTTM', met)),
    revenueGrowth: pctToDec(m('revenueGrowthQuarterlyYoy', met)),
    earningsGrowth: pctToDec(m('epsGrowthTTMYoy', met)),
    trailingEps: m('epsTTM', met),
    forwardEps: m('epsAnnual', met),
    totalCash: latestBS?.cashAndCashEquivalents ?? null,
    totalDebt: latestBS?.totalDebt ?? null,
    debtToEquity: m('longTermDebt/equityQuarterly', met) ?? (latestBS?.totalDebt != null && latestBS?.totalStockholdersEquity ? latestBS.totalDebt / latestBS.totalStockholdersEquity : null),
    currentRatio: m('currentRatioQuarterly', met),
    bookValue: m('bookValuePerShareQuarterly', met),
    operatingCashflow,
    freeCashflow,
    fcfYield,
    dividendYield: pctToDec(m('dividendYieldIndicatedAnnual', met)),
    beta: m('beta', met),
    week52High: m('52WeekHigh', met),
    week52Low: m('52WeekLow', met),
  };
}

function buildAnalystData(data: ComprehensiveData): ResearchContent['analystData'] {
  const recs = data.recommendations?.slice(0, 6) ?? [];
  return {
    targetMeanPrice: data.priceTarget?.targetMean ?? null,
    targetHighPrice: data.priceTarget?.targetHigh ?? null,
    targetLowPrice: data.priceTarget?.targetLow ?? null,
    numberOfAnalysts: null, // Finnhub free tier doesn't return this separately
    recommendationTrend: recs.map(r => ({
      period: r.period,
      strongBuy: r.strongBuy,
      buy: r.buy,
      hold: r.hold,
      sell: r.sell,
      strongSell: r.strongSell,
    })),
  };
}

function buildChartData(data: ComprehensiveData): ResearchContent['chartData'] {
  // Price history from Finnhub candles
  const priceHistory: ResearchContent['chartData']['priceHistory'] = [];
  if (data.candle && data.candle.s === 'ok') {
    for (let i = 0; i < data.candle.c.length; i++) {
      priceHistory.push({
        date: new Date(data.candle.t[i] * 1000).toISOString().split('T')[0],
        close: data.candle.c[i],
      });
    }
  }

  // Earnings from Finnhub
  const earningsHistory = (data.earnings ?? []).slice(0, 12).reverse().map(e => ({
    quarter: `Q${e.quarter} ${e.year}`,
    actual: e.actual,
    estimate: e.estimate,
  }));

  // Revenue & margins from FMP income statements (if available)
  const revenueHistory = data.incomeStatements
    ? [...data.incomeStatements].reverse().map(s => ({
        year: s.fiscalYear,
        revenue: s.revenue,
        netIncome: s.netIncome,
      }))
    : null;

  const marginHistory = data.incomeStatements
    ? [...data.incomeStatements].reverse().map(s => ({
        year: s.fiscalYear,
        grossMargin: s.revenue > 0 ? s.grossProfit / s.revenue : null,
        operatingMargin: s.revenue > 0 ? s.operatingIncome / s.revenue : null,
        netMargin: s.revenue > 0 ? s.netIncome / s.revenue : null,
      }))
    : null;

  return { priceHistory, earningsHistory, revenueHistory, marginHistory };
}

// --- Main research function ---

export async function researchStock(item: WatchlistItem): Promise<{
  content: ResearchContent;
  sentiment: string;
  summary: string;
}> {
  const ai = getAI();

  // Fetch all data in parallel
  const [comprehensiveData, webResearch] = await Promise.all([
    fetchComprehensiveData(item.ticker),
    fetchWebResearch(ai, item),
  ]);

  const analysisContext = buildAnalysisContext(comprehensiveData);

  console.log(`[research] Generating structured report for ${item.ticker}...`);
  console.log(`[research] Context length: ${analysisContext.length} chars`);

  // Generate AI analysis
  const reportPrompt = `You are a senior equity research analyst writing a research note for ${item.name} (${item.ticker})${item.exchange ? ` listed on ${item.exchange}` : ''}.

--- UP-TO-DATE WEB RESEARCH (gathered moments ago via Google Search) ---
${webResearch}
--- END WEB RESEARCH ---

--- FINANCIAL DATA (from Finnhub + Financial Modeling Prep APIs) ---
${analysisContext}
--- END FINANCIAL DATA ---

CRITICAL INSTRUCTIONS:
- The financial data above contains REAL, CURRENT data from professional financial APIs. Use these exact numbers in your analysis.
- DO NOT invent or estimate any financial numbers. Use ONLY the data provided. If a metric shows "N/A", skip it.
- Your role is to INTERPRET the numbers, provide CONTEXT, and deliver INSIGHT.
- Compare metrics to typical sector averages from your knowledge. This is where you add value.
- The web research contains current news and events. Trust it over your training data for recent developments.

Return a JSON object with these exact fields:

{
  "business": {
    "description": "2-sentence explainer of what the company does and how it makes money",
    "moatType": "One or combine: Network Effects, Switching Costs, Brand Power, Cost Advantages, Regulatory/IP Barriers, None/Weak",
    "moatAnalysis": "1 paragraph analyzing the competitive moat",
    "competitiveLandscape": "1 paragraph on key competitors and market position",
    "industryCyclePosition": "1 sentence: e.g., 'Mature growth phase with secular tailwinds from AI adoption'",
    "tamSamSom": "1 paragraph estimating Total Addressable Market, Serviceable Available Market, and current market share"
  },
  "financialAnalysis": {
    "valuationAssessment": "Compare the P/E, PEG, EV/EBITDA to typical sector ranges. Is it cheap, fair, or expensive? Why might a premium/discount be justified?",
    "profitabilityAnalysis": "Are margins expanding or contracting vs the 5Y averages? How does profitability compare to peers?",
    "growthAssessment": "Is growth accelerating or decelerating? Revenue CAGR trend. Organic vs acquisition-driven if known.",
    "balanceSheetHealth": "Net debt position, coverage ratios, financial flexibility. Can the company survive a downturn?",
    "cashFlowQuality": "FCF conversion, capex intensity, dividend sustainability. Cash is truth."
  },
  "qualitative": {
    "managementAssessment": "Capital allocation track record, insider ownership signal, management quality from web research",
    "moatDurability": "How long can the competitive advantage last? What could erode it?",
    "keyRisks": [
      { "category": "e.g., Regulatory/Competition/Macro/Technology/Concentration", "description": "Specific risk description", "severity": "high/medium/low" }
    ],
    "esgConsiderations": "Brief, only if material to investment thesis"
  },
  "thesis": {
    "bullCase": "Best realistic 12-18 month scenario in 2-3 sentences",
    "bearCase": "Worst realistic 12-18 month scenario in 2-3 sentences",
    "catalysts": ["Array of upcoming events or triggers that could move the stock"],
    "fairValueEstimate": "Your rough fair value estimate with brief methodology (DCF, comps, or multiples-based)"
  },
  "verdict": {
    "recommendation": "One of: Strong Buy, Buy, Hold, Sell, Strong Sell",
    "confidenceLevel": "high, medium, or low",
    "timeHorizon": "e.g., 12-18 months",
    "summary": "One paragraph synthesis of the entire thesis"
  },
  "sentiment": "Exactly one of: bullish, bearish, neutral, mixed",
  "summary": "One-sentence summary including the current price"
}

Provide 3-5 specific risks in keyRisks. Each catalyst should be a concrete upcoming event.
All string values should be plain prose paragraphs. Do NOT use markdown formatting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: reportPrompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 12288,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '{}';
  console.log(`[research] Report response length: ${text.length} chars`);

  try {
    const parsed = JSON.parse(text);
    const str = (v: unknown): string =>
      typeof v === 'string' ? v : v ? JSON.stringify(v, null, 2) : '';

    // Assemble the final ResearchContent by merging real API data + AI output
    const content: ResearchContent = {
      _version: 2,

      business: {
        description: str(parsed.business?.description),
        moatType: str(parsed.business?.moatType),
        moatAnalysis: str(parsed.business?.moatAnalysis),
        competitiveLandscape: str(parsed.business?.competitiveLandscape),
        industryCyclePosition: str(parsed.business?.industryCyclePosition),
        tamSamSom: str(parsed.business?.tamSamSom),
        // Merge real profile data
        sector: comprehensiveData.profile?.finnhubIndustry ?? null,
        industry: comprehensiveData.profile?.finnhubIndustry ?? null,
        website: comprehensiveData.profile?.weburl ?? null,
        country: comprehensiveData.profile?.country ?? null,
        peers: (comprehensiveData.peers ?? []).slice(0, 8),
      },

      metrics: buildMetrics(comprehensiveData),
      financialAnalysis: {
        valuationAssessment: str(parsed.financialAnalysis?.valuationAssessment),
        profitabilityAnalysis: str(parsed.financialAnalysis?.profitabilityAnalysis),
        growthAssessment: str(parsed.financialAnalysis?.growthAssessment),
        balanceSheetHealth: str(parsed.financialAnalysis?.balanceSheetHealth),
        cashFlowQuality: str(parsed.financialAnalysis?.cashFlowQuality),
      },

      qualitative: {
        managementAssessment: str(parsed.qualitative?.managementAssessment),
        moatDurability: str(parsed.qualitative?.moatDurability),
        keyRisks: Array.isArray(parsed.qualitative?.keyRisks)
          ? parsed.qualitative.keyRisks.map((r: { category?: string; description?: string; severity?: string }) => ({
              category: str(r.category),
              description: str(r.description),
              severity: (['high', 'medium', 'low'].includes(r.severity ?? '') ? r.severity : 'medium') as 'high' | 'medium' | 'low',
            }))
          : [],
        esgConsiderations: str(parsed.qualitative?.esgConsiderations),
      },

      analystData: buildAnalystData(comprehensiveData),

      ownership: {
        insiderPercent: null, // Finnhub free tier — limited availability
        institutionPercent: null,
      },

      thesis: {
        bullCase: str(parsed.thesis?.bullCase),
        bearCase: str(parsed.thesis?.bearCase),
        catalysts: Array.isArray(parsed.thesis?.catalysts)
          ? parsed.thesis.catalysts.map(String)
          : [],
        fairValueEstimate: str(parsed.thesis?.fairValueEstimate),
      },

      chartData: buildChartData(comprehensiveData),

      verdict: {
        recommendation: (['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'].includes(parsed.verdict?.recommendation)
          ? parsed.verdict.recommendation
          : 'Hold') as ResearchContent['verdict']['recommendation'],
        confidenceLevel: (['high', 'medium', 'low'].includes(parsed.verdict?.confidenceLevel)
          ? parsed.verdict.confidenceLevel
          : 'medium') as ResearchContent['verdict']['confidenceLevel'],
        timeHorizon: str(parsed.verdict?.timeHorizon) || '12-18 months',
        summary: str(parsed.verdict?.summary),
      },
    };

    return {
      content,
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
3. Current analyst consensus: Buy/sell/hold ratings, price targets from major firms.
4. Recent financial performance: Latest quarterly earnings, revenue growth, profitability trends.
5. Competitive landscape: Key competitors and market position changes.
6. Industry trends: Relevant sector developments affecting this company.
7. Management and insider activity: Any notable insider transactions, management changes, or activist investor involvement.
8. Upcoming catalysts: Earnings dates, product launches, regulatory decisions, or events that could move the stock.

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
