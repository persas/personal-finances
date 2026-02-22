'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/layout/header';
import { WatchlistPanel } from '@/components/investments/watchlist-panel';
import { ResearchReportView } from '@/components/investments/research-report';
import { Card } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { WatchlistItem, ResearchReport } from '@/lib/types';

const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

export default function ResearchPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [researchingId, setResearchingId] = useState<number | null>(null);

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
        const err = await res.json();
        throw new Error(err.error || 'Research failed');
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
        {/* Left panel — Watchlist */}
        <Card className="w-80 shrink-0 rounded-none border-y-0 border-l-0 flex flex-col">
          <WatchlistPanel
            items={items}
            selectedId={selectedId}
            onSelect={setSelectedId}
            profileId={profile}
            onRefresh={fetchWatchlist}
            onResearch={handleResearch}
            researchingId={researchingId}
          />
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
}
