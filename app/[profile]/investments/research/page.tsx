'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/layout/header';
import { WatchlistPanel } from '@/components/investments/watchlist-panel';
import { ResearchReportView } from '@/components/investments/research-report';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SentimentBadge } from '@/components/investments/sentiment-badge';
import { Loader2, Search, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { WatchlistItem, ResearchReport } from '@/lib/types';

const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

export default function ResearchPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [researchingId, setResearchingId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  function fetchWatchlist() {
    fetch(`/api/investments/watchlist?profileId=${profile}`)
      .then(res => res.json())
      .then(data => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  useEffect(() => { fetchWatchlist(); }, [profile]);

  const selectedItem = items.find(i => i.id === selectedId);

  async function handleResearch(watchlistId: number) {
    setResearchingId(watchlistId);
    try {
      const res = await fetch('/api/investments/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId }),
      });
      if (!res.ok) {
        let msg = 'Research failed';
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          msg = `Server error (${res.status})`;
        }
        throw new Error(msg);
      }
      toast.success('Research complete');
      fetchWatchlist();
      setSelectedId(watchlistId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Research failed');
    } finally {
      setResearchingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Stock Research" subtitle="Loading..." />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={`${profileNames[profile] || profile} — Research`}
        subtitle={`${items.length} stock${items.length !== 1 ? 's' : ''} in watchlist`}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Watchlist (expanded or collapsed) */}
        <Card
          className={cn(
            'shrink-0 rounded-none border-y-0 border-l-0 flex flex-col transition-all duration-200',
            panelOpen ? 'w-80' : 'w-14',
          )}
        >
          {panelOpen ? (
            <>
              <WatchlistPanel
                items={items}
                selectedId={selectedId}
                onSelect={setSelectedId}
                profileId={profile}
                onRefresh={fetchWatchlist}
                onResearch={handleResearch}
                researchingId={researchingId}
                onCollapse={() => setPanelOpen(false)}
              />
            </>
          ) : (
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-col items-center pt-2 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 mb-1"
                      onClick={() => setPanelOpen(true)}
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand watchlist</TooltipContent>
                </Tooltip>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col items-center gap-1 px-1 pb-2">
                  {items.map(item => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'w-11 rounded-md px-1 py-1.5 text-[10px] font-mono font-medium text-center transition-colors hover:bg-muted',
                            selectedId === item.id && 'bg-primary/10 text-primary ring-1 ring-primary/20',
                          )}
                          onClick={() => { onSelectAndExpand(item.id); }}
                        >
                          {item.ticker.length > 5 ? item.ticker.slice(0, 4) + '…' : item.ticker}
                          {item.latestReport?.sentiment && (
                            <span className={cn(
                              'block w-1.5 h-1.5 rounded-full mx-auto mt-0.5',
                              item.latestReport.sentiment === 'bullish' && 'bg-emerald-500',
                              item.latestReport.sentiment === 'bearish' && 'bg-red-500',
                              item.latestReport.sentiment === 'neutral' && 'bg-zinc-400',
                              item.latestReport.sentiment === 'mixed' && 'bg-amber-500',
                            )} />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col gap-0.5">
                        <span className="font-medium">{item.name}</span>
                        {item.latestReport && (
                          <span className="text-xs text-muted-foreground">
                            {item.latestReport.sentiment} — {new Date(item.latestReport.research_date).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </ScrollArea>
            </TooltipProvider>
          )}
        </Card>

        {/* Right panel — Report */}
        <div className="flex-1 overflow-auto p-6">
          {selectedItem ? (
            <ResearchReportView
              report={selectedItem.latestReport || null}
              ticker={selectedItem.ticker}
              name={selectedItem.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">Select a stock</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choose a stock from your watchlist to view its research report.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function onSelectAndExpand(id: number) {
    setSelectedId(id);
  }
}
