'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentBadge } from '../sentiment-badge';
import type { LegacyResearchContent, Sentiment } from '@/lib/types';

interface Props {
  content: LegacyResearchContent;
  ticker: string;
  name: string;
  sentiment: Sentiment | null;
  summary: string | null;
  researchDate: string;
}

function renderContent(content: unknown): React.ReactNode {
  if (typeof content === 'string') {
    return content.split('\n').filter(p => p.trim()).map((paragraph, i) => (
      <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3">
        {paragraph}
      </p>
    ));
  }
  if (Array.isArray(content)) {
    return (
      <ul className="space-y-3">
        {content.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground/90">{String(item)}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm text-foreground/90">{String(content)}</p>;
}

export function LegacyReport({ content, ticker, name, sentiment, summary, researchDate }: Props) {
  const sections = [
    { key: 'overview', label: 'Overview', content: content.overview },
    { key: 'financials', label: 'Financials', content: content.financials },
    { key: 'sentiment', label: 'Sentiment', content: content.sentiment_analysis },
    { key: 'opportunities', label: 'Opportunities', content: content.opportunities },
    { key: 'risks', label: 'Risks', content: content.risks },
    { key: 'recommendation', label: 'Recommendation', content: content.recommendation },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{name} ({ticker})</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Researched {new Date(researchDate).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        {sentiment && <SentimentBadge sentiment={sentiment} />}
      </div>
      {summary && (
        <p className="text-sm text-muted-foreground italic">{summary}</p>
      )}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          {sections.map(s => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs">{s.label}</TabsTrigger>
          ))}
        </TabsList>
        {sections.map(s => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            {renderContent(s.content)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
