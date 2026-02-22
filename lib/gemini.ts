import { GoogleGenAI } from '@google/genai';
import type { BudgetLine, ParsedTransaction } from './types';

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
