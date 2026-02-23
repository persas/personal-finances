'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

export function FinancialAnalysis({ content }: Props) {
  const { financialAnalysis } = content;

  const sections = [
    { title: 'Valuation Assessment', text: financialAnalysis.valuationAssessment },
    { title: 'Profitability', text: financialAnalysis.profitabilityAnalysis },
    { title: 'Growth', text: financialAnalysis.growthAssessment },
    { title: 'Balance Sheet Health', text: financialAnalysis.balanceSheetHealth },
    { title: 'Cash Flow Quality', text: financialAnalysis.cashFlowQuality },
  ].filter(s => s.text);

  if (sections.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Financial Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map(section => (
          <div key={section.title}>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
              {section.title}
            </h4>
            {section.text.split('\n').filter(p => p.trim()).map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
