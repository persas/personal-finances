'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentBadge } from './sentiment-badge';
import { Search } from 'lucide-react';
import type { ResearchReport as ReportType } from '@/lib/types';

interface Props {
  report: ReportType | null;
  ticker: string;
  name: string;
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
        {content.map((item, i) => {
          if (typeof item === 'string') {
            return <li key={i} className="text-sm leading-relaxed text-foreground/90">{item}</li>;
          }
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item as Record<string, unknown>);
            const title = entries.find(([k]) => ['opportunity', 'risk', 'name', 'title', 'catalyst'].includes(k));
            const desc = entries.find(([k]) => ['description', 'detail', 'details', 'explanation', 'impact'].includes(k));
            return (
              <li key={i} className="text-sm leading-relaxed text-foreground/90">
                {title && <span className="font-medium">{String(title[1])}</span>}
                {title && desc && <span className="text-muted-foreground"> — </span>}
                {desc ? String(desc[1]) : !title ? renderKeyValue(item as Record<string, unknown>) : null}
              </li>
            );
          }
          return <li key={i} className="text-sm text-foreground/90">{String(item)}</li>;
        })}
      </ul>
    );
  }

  if (typeof content === 'object' && content !== null) {
    return renderKeyValue(content as Record<string, unknown>);
  }

  return <p className="text-sm text-foreground/90">{String(content)}</p>;
}

function renderKeyValue(obj: Record<string, unknown>): React.ReactNode {
  return (
    <dl className="space-y-2">
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className="flex gap-2 text-sm">
          <dt className="font-medium text-foreground/70 min-w-[140px] shrink-0">
            {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </dt>
          <dd className="text-foreground/90">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResearchReportView({ report, ticker, name }: Props) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No research available</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click the sparkle icon to run AI research on {ticker}.
        </p>
      </div>
    );
  }

  const sections = [
    { key: 'overview', label: 'Overview', content: report.content.overview },
    { key: 'financials', label: 'Financials', content: report.content.financials },
    { key: 'sentiment', label: 'Sentiment', content: report.content.sentiment_analysis },
    { key: 'opportunities', label: 'Opportunities', content: report.content.opportunities },
    { key: 'risks', label: 'Risks', content: report.content.risks },
    { key: 'recommendation', label: 'Recommendation', content: report.content.recommendation },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{name} ({ticker})</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Researched {new Date(report.research_date).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <SentimentBadge sentiment={report.sentiment} />
        </div>
        {report.summary && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            {typeof report.summary === 'string' ? report.summary : String(report.summary)}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            {sections.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="text-xs">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {sections.map(s => (
            <TabsContent key={s.key} value={s.key} className="mt-4">
              <div className="max-w-none">
                {renderContent(s.content)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
