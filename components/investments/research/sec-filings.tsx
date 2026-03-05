'use client';

import { FileText, ExternalLink } from 'lucide-react';
import type { ResearchContent } from '@/lib/types';

const FILING_LABELS: Record<string, string> = {
  '10-K': 'Annual Report',
  '10-Q': 'Quarterly Report',
  '8-K': 'Current Report',
  '20-F': 'Annual Report (Foreign)',
  '6-K': 'Semi-Annual Report (Foreign)',
  'S-1': 'IPO Registration',
  'S-1/A': 'IPO Registration Amendment',
  'DEF 14A': 'Proxy Statement',
  'DEFA14A': 'Proxy Statement',
  '13F-HR': 'Institutional Holdings',
  'SC 13D': 'Activist Ownership',
  'SC 13D/A': 'Activist Ownership Amendment',
  'SC 13G': 'Institutional Ownership',
  'SC 13G/A': 'Institutional Ownership Amendment',
  '4': 'Insider Transaction',
};

const FILING_COLORS: Record<string, string> = {
  '10-K': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  '10-Q': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  '8-K': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  '4': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

function getFilingColor(type: string): string {
  return FILING_COLORS[type] ?? 'bg-muted text-muted-foreground';
}

interface Props {
  content: ResearchContent;
}

export function SECFilings({ content }: Props) {
  const filings = content.secFilings;
  if (!filings || filings.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">SEC Filings</h3>
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-right font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filings.map((filing, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${getFilingColor(filing.type)}`}>
                    {filing.type}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                    {FILING_LABELS[filing.type] ?? ''}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {filing.date}
                </td>
                <td className="px-3 py-2 text-muted-foreground truncate max-w-[300px]">
                  {filing.description}
                </td>
                <td className="px-3 py-2 text-right">
                  <a
                    href={filing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
