'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RotateCcw, MessageSquareText, Clock } from 'lucide-react';
import type { Report } from '@/lib/types';

interface Props {
  profileId: string;
  month: number;
  year: number;
}

export function MonthlyAnalysis({ profileId, month, year }: Props) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [comments, setComments] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(() => {
    setLoading(true);
    fetch(`/api/reports?profileId=${profileId}&month=${month}&year=${year}`)
      .then(res => res.json())
      .then(data => {
        setReport(data.report || null);
        setShowForm(!data.report);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [profileId, month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, month, year, userComments: comments || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');
      setReport(data.report);
      setShowForm(false);
      setComments('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-violet-500" />
      <CardHeader className="pl-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <CardTitle className="text-lg">Monthly Analysis</CardTitle>
          </div>
          {report && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Re-analyze
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pl-7">
        {/* Generate form */}
        {showForm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MessageSquareText className="h-3.5 w-3.5" />
                Context for the analysis
                <span className="font-normal">(optional)</span>
              </label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="e.g. The washing machine broke so I had to buy a new one, holiday trip to Italy..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                disabled={generating}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <Button
                onClick={generate}
                disabled={generating}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Month
                  </>
                )}
              </Button>
              {report && (
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Report display */}
        {report && !showForm && (
          <div className="space-y-4">
            {report.user_comments && (
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Your context</p>
                <p className="text-sm">{report.user_comments}</p>
              </div>
            )}

            <div
              className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-headings:font-semibold prose-p:text-sm prose-li:text-sm prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(report.report_text) }}
            />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3 w-3" />
              Generated {formatDate(report.created_at)}
            </div>
          </div>
        )}

        {/* Empty state — no report, form not shown (shouldn't happen but safe) */}
        {!report && !showForm && (
          <p className="text-sm text-muted-foreground">
            No analysis yet. Click above to generate one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

// Minimal markdown → HTML converter (handles headers, bold, italic, lists, paragraphs)
function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Line breaks → paragraphs
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}
