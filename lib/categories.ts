export const BUDGET_GROUPS = [
  'Fixed Costs',
  'Savings Goals',
  'Guilt-Free',
  'Investments',
  'Pre-Tax',
] as const;

export const TRANSACTION_TYPES = [
  'expense',
  'income',
  'transfer',
  'internal',
  'credit',
] as const;

export const BUDGET_GROUP_COLORS: Record<string, string> = {
  'Fixed Costs': '#3b82f6',
  'Savings Goals': '#f59e0b',
  'Guilt-Free': '#8b5cf6',
  'Investments': '#22c55e',
  'Pre-Tax': '#ef4444',
  'Income': '#10b981',
  'Transfer': '#64748b',
  'Internal': '#475569',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Travel & Leisure': '#3b82f6',
  'Shared Household': '#8b5cf6',
  'Gifts & Celebrations': '#f59e0b',
  'Taxes & Social Security': '#ef4444',
  'Car Loan': '#dc2626',
  'Fuel': '#a855f7',
  'Garage Rent': '#78716c',
  'Groceries': '#22c55e',
  'Health': '#ec4899',
  'Dining Out': '#f97316',
  'Shopping': '#06b6d4',
  'Fitness': '#14b8a6',
  'Parking & Tolls': '#64748b',
  'Subscriptions': '#6366f1',
  'Telecom': '#0ea5e9',
  'Credit/Reward': '#10b981',
  'Salary': '#22c55e',
  'Freelance Income': '#10b981',
  'Reimbursement': '#6ee7b7',
  'Inter-account Transfer': '#94a3b8',
  'Internal Savings': '#475569',
};

export const PROFILES = [
  { id: 'diego', name: 'Diego', description: 'Personal finances' },
  { id: 'marta', name: 'Marta', description: 'Personal finances' },
  { id: 'casa', name: 'Casa', description: 'Joint household (Diego & Marta)' },
] as const;

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#64748b';
}

export function getBudgetGroupColor(group: string): string {
  return BUDGET_GROUP_COLORS[group] || '#64748b';
}
