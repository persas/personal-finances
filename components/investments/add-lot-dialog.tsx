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

export function AddLotDialog({ open, onOpenChange, assetId, assetName, onSuccess }: Props) {
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!quantity || !pricePerUnit || !purchaseDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/investments/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          quantity: Number(quantity),
          price_per_unit: Number(pricePerUnit),
          purchase_date: purchaseDate,
        }),
      });
      if (!res.ok) throw new Error('Failed to add lot');
      setQuantity(''); setPricePerUnit('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error('Add lot error:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Lot — {assetName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Price per Unit</Label>
            <Input type="number" step="any" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Purchase Date</Label>
            <Input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !quantity || !pricePerUnit}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Lot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
