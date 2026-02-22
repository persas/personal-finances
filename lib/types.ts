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

// ---- Investment Types ----

export type AssetType = 'stock' | 'etf' | 'fund' | 'crypto' | 'other';
export type PriceSource = 'yahoo' | 'coingecko' | 'manual';
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
  content: ResearchContent;
  sentiment: Sentiment | null;
  summary: string | null;
  model_used: string;
}

export interface ResearchContent {
  overview: string;
  financials: string;
  sentiment_analysis: string;
  opportunities: string;
  risks: string;
  recommendation: string;
}
