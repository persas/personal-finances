'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ASSET_TYPE_LABELS } from '@/lib/categories';
import { ManualPriceDialog } from './manual-price-dialog';
import { AddLotDialog } from './add-lot-dialog';
import { ChevronDown, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import type { PortfolioHolding } from '@/lib/types';
import { toast } from 'sonner';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  holdings: PortfolioHolding[];
  onRefresh: () => void;
}

export function HoldingsTable({ holdings, onRefresh }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [priceDialog, setPriceDialog] = useState<{ assetId: number; assetName: string } | null>(null);
  const [lotDialog, setLotDialog] = useState<{ assetId: number; assetName: string } | null>(null);

  function toggleExpanded(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteAsset(id: number, name: string) {
    if (!confirm(`Delete ${name} and all its lots?`)) return;
    try {
      await fetch(`/api/investments/assets?id=${id}`, { method: 'DELETE' });
      toast.success(`Deleted ${name}`);
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  }

  async function deleteLot(id: number) {
    try {
      await fetch(`/api/investments/lots?id=${id}`, { method: 'DELETE' });
      toast.success('Lot deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete lot');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">P&L %</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    No holdings yet. Add your first asset to get started.
                  </TableCell>
                </TableRow>
              )}
              {holdings.flatMap(h => {
                const isExpanded = expandedIds.has(h.asset.id);
                const isPositive = (h.gainLoss ?? 0) >= 0;
                const plColor = isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400';

                const rows = [
                  <TableRow
                    key={`asset-${h.asset.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpanded(h.asset.id)}
                  >
                    <TableCell className="px-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{h.asset.name}</div>
                      {h.asset.ticker && (
                        <span className="text-xs text-muted-foreground">{h.asset.ticker}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ASSET_TYPE_LABELS[h.asset.asset_type] || h.asset.asset_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {h.totalQuantity > 0 ? h.totalQuantity.toLocaleString('es-ES', { maximumFractionDigits: 6 }) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {h.avgCostPerUnit > 0 ? fmt(h.avgCostPerUnit) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {h.currentPrice != null ? fmt(h.currentPrice) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {h.currentValue != null ? fmt(h.currentValue) : fmt(h.totalCost)}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm font-medium ${plColor}`}>
                      {h.gainLoss != null ? `${isPositive ? '+' : ''}${fmt(h.gainLoss)}` : '—'}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm font-medium ${plColor}`}>
                      {h.gainLossPercent != null
                        ? `${isPositive ? '+' : ''}${h.gainLossPercent.toFixed(1)}%`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        {!h.asset.is_public && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setPriceDialog({ assetId: h.asset.id, assetName: h.asset.name })}
                            title="Update price"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => setLotDialog({ assetId: h.asset.id, assetName: h.asset.name })}
                          title="Add lot"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => deleteAsset(h.asset.id, h.asset.name)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                ];

                if (isExpanded) {
                  if (h.lots.length > 0) {
                    h.lots.forEach(lot => {
                      rows.push(
                        <TableRow key={`lot-${lot.id}`} className="bg-muted/30">
                          <TableCell />
                          <TableCell className="text-xs text-muted-foreground pl-8">
                            Lot — {lot.purchase_date}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right font-mono text-xs">
                            {lot.quantity.toLocaleString('es-ES', { maximumFractionDigits: 6 })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {fmt(lot.price_per_unit)}
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right font-mono text-xs">
                            {fmt(lot.quantity * lot.price_per_unit)}
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => deleteLot(lot.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  } else {
                    rows.push(
                      <TableRow key={`empty-${h.asset.id}`} className="bg-muted/30">
                        <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-4">
                          No lots recorded
                        </TableCell>
                      </TableRow>
                    );
                  }
                }

                return rows;
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {priceDialog && (
        <ManualPriceDialog
          open
          onOpenChange={() => setPriceDialog(null)}
          assetId={priceDialog.assetId}
          assetName={priceDialog.assetName}
          onSuccess={onRefresh}
        />
      )}

      {lotDialog && (
        <AddLotDialog
          open
          onOpenChange={() => setLotDialog(null)}
          assetId={lotDialog.assetId}
          assetName={lotDialog.assetName}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
