'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/layout/header';
import { PortfolioKPICards } from '@/components/investments/portfolio-kpi-cards';
import { AllocationChart } from '@/components/investments/allocation-chart';
import { HoldingsTable } from '@/components/investments/holdings-table';
import { AddAssetDialog } from '@/components/investments/add-asset-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { PortfolioSummary } from '@/lib/types';

const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

export default function PortfolioPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  function fetchData() {
    setLoading(true);
    fetch(`/api/investments/assets?profileId=${profile}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [profile]);

  async function handleUpdatePrices() {
    setUpdating(true);
    try {
      const res = await fetch('/api/investments/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', profileId: profile }),
      });
      const result = await res.json();
      if (result.updated > 0) {
        toast.success(`Updated prices for ${result.updated} asset${result.updated > 1 ? 's' : ''}`);
      }
      if (result.errors?.length > 0) {
        toast.error(`Errors: ${result.errors.join(', ')}`);
      }
      if (result.updated === 0 && (!result.errors || result.errors.length === 0)) {
        toast.info('No public assets to update');
      }
      fetchData();
    } catch {
      toast.error('Failed to update prices');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Header title="Portfolio" subtitle="Loading..." />
        <div className="flex items-center justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isEmpty = !data || data.holdings.length === 0;

  return (
    <div className="flex flex-col">
      <Header
        title={`${profileNames[profile] || profile} — Portfolio`}
        subtitle={data ? `${data.holdings.length} asset${data.holdings.length !== 1 ? 's' : ''}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleUpdatePrices} disabled={updating}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Update Prices
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        }
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No holdings yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first asset to start tracking your portfolio.
          </p>
          <Button className="mt-4" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      ) : (
        <div className="space-y-6 p-6 lg:p-8">
          <PortfolioKPICards data={data!} />

          {data!.allocationByType.length > 1 && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <AllocationChart data={data!.allocationByType} total={data!.totalValue} />
              </div>
              <div className="lg:col-span-2">
                <HoldingsTable holdings={data!.holdings} onRefresh={fetchData} />
              </div>
            </div>
          )}

          {data!.allocationByType.length <= 1 && (
            <HoldingsTable holdings={data!.holdings} onRefresh={fetchData} />
          )}
        </div>
      )}

      <AddAssetDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        profileId={profile}
        onSuccess={fetchData}
      />
    </div>
  );
}
