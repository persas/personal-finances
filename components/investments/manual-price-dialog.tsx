'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  assetName: string;
  onSuccess: () => void;
}

export function ManualPriceDialog({ open, onOpenChange, assetId, assetName, onSuccess }: Props) {
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!price || !date) return;
    setSaving(true);
    try {
      const res = await fetch('/api/investments/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          asset_id: assetId,
          price: Number(price),
          date,
        }),
      });
      if (!res.ok) throw new Error('Failed to save price');
      setPrice('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error('Manual price error:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Price — {assetName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Current Price</Label>
            <Input
              type="number"
              step="any"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !price}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
