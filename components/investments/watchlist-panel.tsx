'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SentimentBadge } from './sentiment-badge';
import { Plus, Trash2, Sparkles, Loader2, PanelLeftClose } from 'lucide-react';
import { toast } from 'sonner';
import type { WatchlistItem } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  items: WatchlistItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  profileId: string;
  onRefresh: () => void;
  onResearch: (id: number) => void;
  researchingId: number | null;
  onCollapse?: () => void;
}

export function WatchlistPanel({
  items, selectedId, onSelect, profileId, onRefresh, onResearch, researchingId, onCollapse,
}: Props) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!ticker || !name) return;
    setAdding(true);
    try {
      const res = await fetch('/api/investments/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, ticker, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to add');
        return;
      }
      setTicker('');
      setName('');
      toast.success(`Added ${ticker.toUpperCase()} to watchlist`);
      onRefresh();
    } catch {
      toast.error('Failed to add to watchlist');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: number, itemTicker: string) {
    try {
      await fetch(`/api/investments/watchlist?id=${id}`, { method: 'DELETE' });
      toast.success(`Removed ${itemTicker}`);
      onRefresh();
    } catch {
      toast.error('Failed to remove');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add form */}
      <div className="space-y-2 p-4 border-b">
        <div className="flex gap-2">
          {onCollapse && (
            <Button
              variant="ghost" size="icon" className="h-9 w-9 shrink-0"
              onClick={onCollapse}
              title="Collapse panel"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
          <Input
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker"
            className="w-20"
          />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Company name"
            className="flex-1"
          />
          <Button size="icon" onClick={handleAdd} disabled={adding || !ticker || !name}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {items.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Add stocks to your watchlist to research them.
          </div>
        )}
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors hover:bg-muted/50',
              selectedId === item.id && 'bg-primary/5 border-l-2 border-l-primary'
            )}
            onClick={() => onSelect(item.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{item.ticker}</Badge>
                <span className="text-sm font-medium truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {item.latestReport && (
                  <>
                    <SentimentBadge sentiment={item.latestReport.sentiment} />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.latestReport.research_date).toLocaleDateString('es-ES')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => onResearch(item.id)}
                disabled={researchingId === item.id}
                title="Research with AI"
              >
                {researchingId === item.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Sparkles className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                onClick={() => handleRemove(item.id, item.ticker)}
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
