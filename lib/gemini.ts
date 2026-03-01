import { GoogleGenAI } from '@google/genai';
import type { BudgetLine, ParsedTransaction, DashboardData } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function parseAndCategorizeCSV(
  csvText: string,
  budgetLines: BudgetLine[],
  profileName: string
): Promise<ParsedTransaction[]> {
  const budgetContext = budgetLines
    .map(b => `  - [${b.budget_group}] ${b.line_name}: ${b.monthly_amount}€/month`)
    .join('\n');

  const prompt = `You are a personal finance assistant for ${profileName}. Parse this bank statement CSV and categorize every single transaction.

The user's budget structure for reference:
${budgetContext}

For EACH transaction row in the CSV, return a JSON object with these exact fields:
- date: string in YYYY-MM-DD format
- description: cleaned merchant/payee name (remove excess codes, keep readable)
- amount: positive number (always positive regardless of direction)
- type: one of "expense" | "income" | "transfer" | "internal" | "credit"
- source: detected bank name (e.g. "BBVA", "Revolut", "AMEX", or whatever bank this CSV is from)
- category: descriptive category (e.g. "Groceries", "Fuel", "Travel & Leisure", "Dining Out", "Subscriptions", "Health", "Salary", "Freelance Income", "Shopping", "Gifts & Celebrations", "Car Loan", "Garage Rent", "Parking & Tolls", "Fitness", "Telecom", "Shared Household", "Taxes & Social Security", "Inter-account Transfer", "Internal Savings", "Credit/Reward", "Reimbursement", etc.)
- budget_group: one of "Fixed Costs" | "Savings Goals" | "Guilt-Free" | "Investments" | "Pre-Tax" | "Income" | "Transfer" | "Internal"
- budget_line: matching line name from the budget structure above, or "—" if no match
- notes: brief context about the transaction (1 sentence max)

Rules:
- Transfers between the user's own bank accounts → type "transfer", budget_group "Transfer"
- Internal savings movements (e.g. Revolut Flexible Cash Funds) → type "internal", budget_group "Internal"
- Credits, refunds, cashback → type "credit"
- Salary, freelance income, reimbursements received → type "income", budget_group "Income"
- Amounts must ALWAYS be positive numbers. The "type" field indicates the direction.
- Auto-detect the bank from CSV format/headers (BBVA, Revolut, AMEX, CaixaBank, ING, etc.)
- IMPORTANT: There is no Bankinter account. If the CSV looks like it could be Bankinter, it is actually BBVA. Always use "BBVA" as the source, never "Bankinter".
- Fuel/gasoline transactions over 25€ are for leisure road trips, NOT daily commuting. Categorize them as category "Fuel", budget_group "Guilt-Free", budget_line "GF: Transportation". Only fuel transactions of 25€ or less should go to budget_group "Fixed Costs", budget_line "Transportation".
- IMPORTANT: For Guilt-Free expenses, use these specific budget_lines for granularity:
  - "GF: Transportation" — fuel for road trips (>25€), flights, car rentals, taxis/Uber for leisure, tolls on trips
  - "GF: Dining & Drinks" — restaurants, bars, cafes, takeout, coffee shops (leisure meals/drinks)
  - "GF: Entertainment" — movies, concerts, events, sports tickets, gaming, theme parks, streaming
  - "GF: Shopping" — clothing, electronics, gadgets, home decor, personal items, online shopping
  - "GF: Travel" — hotels, Airbnb, vacation packages, excursions, tours, travel insurance
  - "GF: Personal Care" — haircuts, barber, spa, grooming, beauty products
  - "GF: Hobbies" — sports equipment, books, courses, music gear, hobby supplies
  - "Guilt-Free Spending" — only use this as a fallback if the expense doesn't fit any subcategory above
- Skip header rows, metadata rows, summary rows — only include actual transactions
- Parse dates correctly regardless of format (DD/MM/YYYY, MM/DD/YY, YYYY-MM-DD, etc.)
- Handle comma decimal separators (European format) and period decimal separators
- If a transaction description is in Spanish, keep the notes in Spanish too

Return ONLY a valid JSON array. No markdown fences, no explanation text, just the JSON array.

CSV Content:
${csvText}`;

  console.log(`[Gemini] Calling model for ${profileName} with ${budgetLines.length} budget lines...`);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '[]';
  console.log(`[Gemini] Raw response length: ${text.length} chars`);
  console.log(`[Gemini] Response preview: ${text.substring(0, 200)}...`);

  try {
    const parsed = JSON.parse(text) as ParsedTransaction[];
    console.log(`[Gemini] Parsed ${parsed.length} transactions successfully`);
    // Validate and clean each transaction
    return parsed.map(tx => ({
      date: tx.date || '',
      description: tx.description || 'Unknown',
      amount: Math.abs(Number(tx.amount) || 0),
      type: tx.type || 'expense',
      source: tx.source || 'Unknown',
      category: tx.category || 'Uncategorized',
      budget_group: tx.budget_group || 'Guilt-Free',
      budget_line: tx.budget_line || '—',
      notes: tx.notes || '',
    }));
  } catch (e) {
    console.error('[Gemini] Failed to parse response as JSON:', e);
    console.error('[Gemini] Full raw response:', text);
    throw new Error(`Failed to parse Gemini response. Raw start: ${text.substring(0, 300)}`);
  }
}

export async function analyzeMonth(
  data: DashboardData,
  userComments: string | null,
  profileName: string
): Promise<string> {
  const { kpis, budgetComparison, categoryBreakdown } = data;

  const budgetGroupsContext = budgetComparison.groups
    .map(g => `  - ${g.group}: Budget ${g.budget.toFixed(2)}€, Actual ${g.actual.toFixed(2)}€, Delta ${g.delta >= 0 ? '+' : ''}${g.delta.toFixed(2)}€`)
    .join('\n');

  const budgetLinesContext = budgetComparison.lines
    .map(l => `  - [${l.group}] ${l.line}: Budget ${l.budget.toFixed(2)}€, Actual ${l.actual.toFixed(2)}€, Delta ${l.delta >= 0 ? '+' : ''}${l.delta.toFixed(2)}€`)
    .join('\n');

  const categoriesContext = categoryBreakdown
    .slice(0, 15)
    .map(c => `  - ${c.category}: ${c.total.toFixed(2)}€ (${c.count} transactions)`)
    .join('\n');

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prompt = `You are a personal finance advisor analyzing ${profileName}'s spending for ${monthNames[data.month]} ${data.year}.

Here is the financial data for this month:

**Key Metrics:**
- Total Income: ${kpis.totalIncome.toFixed(2)}€
- Total Expenses: ${kpis.totalExpenses.toFixed(2)}€
- Net Savings: ${kpis.netSavings.toFixed(2)}€
- Savings Rate: ${kpis.savingsRate.toFixed(1)}%
- Daily Average Spend: ${kpis.dailyAvgSpend.toFixed(2)}€
- Transaction Count: ${kpis.transactionCount}

**Budget vs Actual by Group:**
${budgetGroupsContext}

**Budget vs Actual by Line:**
${budgetLinesContext}

**Top Spending Categories:**
${categoriesContext}

${userComments ? `**User's comments / context for this month:**\n${userComments}\n` : ''}
Write a concise monthly financial report in markdown. Structure it as:

1. **Overall Verdict** — A single sentence: are they on track, slightly over, or significantly over budget this month? Use a clear emoji indicator (✅, ⚠️, or 🚨).

2. **Income & Savings** — Brief assessment of income vs expenses and savings rate.

3. **Budget Analysis** — Go through each budget group. For groups that are over budget, explain by how much and which specific lines are the culprits. For groups under budget, briefly acknowledge. Focus on the meaningful variances.

4. **Top Concerns** — List the 2-3 biggest issues or areas of overspending, if any.

5. **Recommendations** — 2-3 specific, actionable suggestions for next month.

Rules:
- Be direct and honest but not preachy
- Use actual euro amounts, not just percentages
- If the user provided comments explaining unusual spending, acknowledge them and factor them into the analysis
- Keep it concise — the whole report should be readable in under 2 minutes
- Write amounts with € symbol
- A positive delta means over budget (bad for expenses), negative delta means under budget (good)
- Do not use markdown headers larger than h3 (###)`;

  console.log(`[Gemini] Analyzing month ${data.month}/${data.year} for ${profileName}...`);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });

  const text = response.text?.trim() || '';
  console.log(`[Gemini] Analysis response length: ${text.length} chars`);

  if (!text) {
    throw new Error('Gemini returned an empty analysis');
  }

  return text;
}
