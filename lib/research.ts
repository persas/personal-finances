import { GoogleGenAI } from '@google/genai';
import type { ResearchContent, WatchlistItem } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function researchStock(item: WatchlistItem): Promise<{
  content: ResearchContent;
  sentiment: string;
  summary: string;
}> {
  const prompt = `You are a financial research analyst. Provide a comprehensive research report for ${item.name} (${item.ticker})${item.exchange ? ` listed on ${item.exchange}` : ''}.

Structure your response as a JSON object with these exact fields:
- overview: Company/asset overview, what they do, market position, recent news (2-3 paragraphs)
- financials: Key financial metrics, revenue trends, profitability, debt levels, valuations (P/E, P/S, etc.)
- sentiment_analysis: Current market sentiment, analyst ratings, recent price action, momentum indicators
- opportunities: Growth catalysts, competitive advantages, upcoming events that could drive value
- risks: Key risks, competitive threats, regulatory concerns, macroeconomic headwinds
- recommendation: Your overall assessment and recommendation (1 paragraph)
- sentiment: One of "bullish", "bearish", "neutral", or "mixed"
- summary: One-sentence summary of the outlook

Return ONLY valid JSON. No markdown fences.`;

  console.log(`[research] Researching ${item.ticker} (${item.name})...`);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '{}';
  console.log(`[research] Response length: ${text.length} chars`);

  try {
    const parsed = JSON.parse(text);
    return {
      content: {
        overview: parsed.overview || '',
        financials: parsed.financials || '',
        sentiment_analysis: parsed.sentiment_analysis || '',
        opportunities: parsed.opportunities || '',
        risks: parsed.risks || '',
        recommendation: parsed.recommendation || '',
      },
      sentiment: parsed.sentiment || 'neutral',
      summary: parsed.summary || '',
    };
  } catch (e) {
    console.error('[research] Failed to parse response:', e);
    throw new Error(`Failed to parse research response for ${item.ticker}`);
  }
}
