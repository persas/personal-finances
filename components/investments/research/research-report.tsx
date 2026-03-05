'use client';

import { useRef } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useExportPdf } from '@/lib/hooks/use-export-pdf';
import { ReportHeader } from './report-header';
import { PriceChart } from './price-chart';
import { KpiStrip } from './kpi-strip';
import { BusinessOverview } from './business-overview';
import { FinancialMetricsGrid } from './financial-metrics-grid';
import { FinancialAnalysis } from './financial-analysis';
import { FinancialCharts } from './financial-charts';
import { AnalystConsensus } from './analyst-consensus';
import { SECFilings } from './sec-filings';
import { QualitativeSection } from './qualitative-section';
import { BullBearThesis } from './bull-bear-thesis';
import { VerdictCard } from './verdict-card';
import { LegacyReport } from './legacy-report';
import type {
  ResearchReport as ReportType,
  ResearchContent,
  LegacyResearchContent,
} from '@/lib/types';

interface Props {
  report: ReportType | null;
  ticker: string;
  name: string;
}

export function ResearchReportView({ report, ticker, name }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const dateStr = report
    ? new Date(report.research_date).toISOString().slice(0, 10)
    : '';
  const filename = `${ticker}_research_${dateStr}.pdf`;

  const { exportPdf, isExporting } = useExportPdf(reportRef, { filename });

  const handleExportPdf = async () => {
    try {
      await exportPdf();
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

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

  // Detect legacy vs new format
  const isLegacy = !('_version' in report.content);

  if (isLegacy) {
    return (
      <LegacyReport
        content={report.content as LegacyResearchContent}
        ticker={ticker}
        name={name}
        sentiment={report.sentiment}
        summary={report.summary}
        researchDate={report.research_date}
      />
    );
  }

  const content = report.content as ResearchContent;

  return (
    <div ref={reportRef} className="space-y-6 pb-8">
      {/* Header */}
      <ReportHeader
        content={content}
        ticker={ticker}
        name={name}
        sentiment={report.sentiment}
        summary={report.summary}
        researchDate={report.research_date}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
      />

      {/* Price Chart */}
      {content.chartData.priceHistory.length >= 2 && (
        <PriceChart priceHistory={content.chartData.priceHistory} />
      )}

      {/* KPI Strip */}
      <KpiStrip content={content} />

      <Separator />

      {/* Business Overview */}
      <BusinessOverview content={content} />

      <Separator />

      {/* Financial Metrics Grid */}
      <FinancialMetricsGrid content={content} />

      {/* Financial Analysis (AI prose) */}
      <FinancialAnalysis content={content} />

      {/* Financial Charts (revenue, margins, earnings) */}
      <FinancialCharts content={content} />

      <Separator />

      {/* SEC Filings */}
      <SECFilings content={content} />

      <Separator />

      {/* Analyst Consensus */}
      <AnalystConsensus content={content} />

      <Separator />

      {/* Qualitative Assessment */}
      <QualitativeSection content={content} />

      <Separator />

      {/* Bull / Bear Thesis */}
      <BullBearThesis content={content} />

      <Separator />

      {/* Verdict */}
      <VerdictCard content={content} />
    </div>
  );
}
