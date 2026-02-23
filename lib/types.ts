export interface Profile {
  id: string;
  name: string;
  description: string | null;
}

export interface BudgetLine {
  id: number;
  profile_id: string;
  budget_group: BudgetGroup;
  line_name: string;
  monthly_amount: number;
  annual_amount: number;
  is_annual: boolean;
  year: number;
}

export interface Transaction {
  id: number;
  profile_id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Always positive
  type: TransactionType;
  source: string | null;
  category: string | null;
  budget_group: string | null;
  budget_line: string | null;
  notes: string | null;
  upload_batch_id: string | null;
  month: number;
  year: number;
  created_at: string;
}

export interface Upload {
  id: string;
  profile_id: string;
  source: string;
  filename: string;
  uploaded_at: string;
  transaction_count: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'internal' | 'credit';

export type BudgetGroup =
  | 'Fixed Costs'
  | 'Savings Goals'
  | 'Guilt-Free'
  | 'Investments'
  | 'Pre-Tax';

// What Gemini returns for each parsed transaction
export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  source: string;
  category: string;
  budget_group: string;
  budget_line: string;
  notes: string;
}

// Dashboard aggregated data
export interface DashboardData {
  profile: Profile;
  month: number;
  year: number;
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    dailyAvgSpend: number;
    transactionCount: number;
  };
  budgetComparison: {
    groups: BudgetGroupSummary[];
    lines: BudgetLineSummary[];
  };
  categoryBreakdown: CategoryTotal[];
  transactions: Transaction[];
}

export interface BudgetGroupSummary {
  group: string;
  budget: number;
  actual: number;
  delta: number;
}

export interface BudgetLineSummary {
  group: string;
  line: string;
  budget: number;
  actual: number;
  delta: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

export interface YearlyDashboardData {
  profile: Profile;
  year: number;
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    monthsWithData: number;
  };
  monthlyTrend: {
    month: number;
    income: number;
    expenses: number;
  }[];
  annualBudgetBurn: {
    group: string;
    line: string;
    annualBudget: number;
    spentYTD: number;
    percentUsed: number;
  }[];
  budgetGroupSummary: BudgetGroupYearlySummary[];
  monthlyByGroup: MonthlyByGroupEntry[];
  categoryBreakdown: CategoryTotal[];
}

export interface BudgetGroupYearlySummary {
  group: string;
  annualBudget: number;
  spentYTD: number;
  percentUsed: number;
  remainingBudget: number;
  expectedPace: number;
  status: 'on_track' | 'over_pace' | 'over_budget';
}

export interface MonthlyByGroupEntry {
  month: number;
  [key: string]: number;
}

// ---- Monthly Analysis Reports (from main) ----

export interface Report {
  id: number;
  profile_id: string;
  month: number;
  year: number;
  user_comments: string | null;
  report_text: string;
  created_at: string;
}

// ---- Investment Types ----

export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto' | 'other';
export type PriceSource = 'yahoo' | 'finnhub' | 'coingecko' | 'manual';
export type Sentiment = 'bullish' | 'bearish' | 'neutral' | 'mixed';

export interface PortfolioAsset {
  id: number;
  profile_id: string;
  name: string;
  ticker: string | null;
  asset_type: AssetType;
  is_public: number;
  provider_id: string | null;
  currency: string;
  notes: string | null;
  created_at: string;
}

export interface PortfolioLot {
  id: number;
  asset_id: number;
  quantity: number;
  price_per_unit: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
}

export interface AssetPrice {
  id: number;
  asset_id: number;
  price: number;
  date: string;
  source: PriceSource;
  created_at: string;
}

export interface PortfolioHolding {
  asset: PortfolioAsset;
  lots: PortfolioLot[];
  totalQuantity: number;
  totalCost: number;
  avgCostPerUnit: number;
  currentPrice: number | null;
  currentValue: number | null;
  gainLoss: number | null;
  gainLossPercent: number | null;
  lastPriceDate: string | null;
  lastPriceSource: PriceSource | null;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: PortfolioHolding[];
  allocationByType: { type: AssetType; value: number; percentage: number }[];
}

export interface WatchlistItem {
  id: number;
  profile_id: string;
  ticker: string;
  name: string;
  asset_type: AssetType;
  exchange: string | null;
  added_at: string;
  latestReport?: ResearchReport | null;
}

export interface ResearchReport {
  id: number;
  watchlist_id: number;
  research_date: string;
  content: ResearchContent | LegacyResearchContent;
  sentiment: Sentiment | null;
  summary: string | null;
  model_used: string;
}

// Legacy format (version 1) — kept for backward compatibility with existing reports
export interface LegacyResearchContent {
  overview: string;
  financials: string;
  sentiment_analysis: string;
  opportunities: string;
  risks: string;
  recommendation: string;
}

// Analyst-grade format (version 2)
export interface ResearchContent {
  _version: 2;

  // Business Overview — AI-generated + Finnhub profile data
  business: {
    description: string;
    moatType: string;
    moatAnalysis: string;
    competitiveLandscape: string;
    industryCyclePosition: string;
    tamSamSom: string;
    sector: string | null;
    industry: string | null;
    website: string | null;
    country: string | null;
    peers: string[];
  };

  // Financial Metrics — ALL from Finnhub/FMP, zero AI
  metrics: {
    price: number | null;
    currency: string;
    marketCap: number | null;
    enterpriseValue: number | null;
    trailingPE: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    priceToBook: number | null;
    evToEbitda: number | null;
    priceToSales: number | null;
    priceToCashFlow: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    netMargin: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    roic: number | null;
    revenueGrowth: number | null;
    earningsGrowth: number | null;
    trailingEps: number | null;
    forwardEps: number | null;
    totalCash: number | null;
    totalDebt: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    bookValue: number | null;
    operatingCashflow: number | null;
    freeCashflow: number | null;
    fcfYield: number | null;
    dividendYield: number | null;
    beta: number | null;
    week52High: number | null;
    week52Low: number | null;
  };

  // AI interpretation of the real numbers
  financialAnalysis: {
    valuationAssessment: string;
    profitabilityAnalysis: string;
    growthAssessment: string;
    balanceSheetHealth: string;
    cashFlowQuality: string;
  };

  // Qualitative layer — AI from web research
  qualitative: {
    managementAssessment: string;
    moatDurability: string;
    keyRisks: Array<{
      category: string;
      description: string;
      severity: 'high' | 'medium' | 'low';
    }>;
    esgConsiderations: string;
  };

  // Analyst consensus — from Finnhub
  analystData: {
    targetMeanPrice: number | null;
    targetHighPrice: number | null;
    targetLowPrice: number | null;
    numberOfAnalysts: number | null;
    recommendationTrend: Array<{
      period: string;
      strongBuy: number;
      buy: number;
      hold: number;
      sell: number;
      strongSell: number;
    }>;
  };

  // Ownership — from Finnhub metrics
  ownership: {
    insiderPercent: number | null;
    institutionPercent: number | null;
  };

  // Bull/Bear thesis — AI-generated
  thesis: {
    bullCase: string;
    bearCase: string;
    catalysts: string[];
    fairValueEstimate: string;
  };

  // Chart data — real API data for Recharts
  chartData: {
    priceHistory: Array<{ date: string; close: number }>;
    earningsHistory: Array<{
      quarter: string;
      actual: number | null;
      estimate: number | null;
    }>;
    revenueHistory: Array<{
      year: string;
      revenue: number | null;
      netIncome: number | null;
    }> | null;
    marginHistory: Array<{
      year: string;
      grossMargin: number | null;
      operatingMargin: number | null;
      netMargin: number | null;
    }> | null;
  };

  // Final verdict — AI-generated
  verdict: {
    recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    confidenceLevel: 'high' | 'medium' | 'low';
    timeHorizon: string;
    summary: string;
  };
}

export function isLegacyResearchContent(
  content: ResearchContent | LegacyResearchContent,
): content is LegacyResearchContent {
  return !('_version' in content);
}
