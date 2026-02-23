'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ASSET_TYPES, ASSET_TYPE_LABELS, TOP_CRYPTOS } from '@/lib/categories';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

export function AddAssetDialog({ open, onOpenChange, profileId, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [assetType, setAssetType] = useState('stock');
  const [isPublic, setIsPublic] = useState(true);
  const [providerId, setProviderId] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [notes, setNotes] = useState('');
  const [cryptoPreset, setCryptoPreset] = useState('');

  // Lot fields
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [saving, setSaving] = useState(false);

  function handleCryptoPreset(value: string) {
    setCryptoPreset(value);
    if (value === 'custom') {
      setProviderId('');
      setName('');
      setTicker('');
      return;
    }
    const crypto = TOP_CRYPTOS.find(c => c.providerId === value);
    if (crypto) {
      setName(crypto.name);
      setTicker(crypto.ticker);
      setProviderId(crypto.providerId);
    }
  }

  function reset() {
    setName(''); setTicker(''); setAssetType('stock'); setIsPublic(true);
    setProviderId(''); setCurrency('EUR'); setNotes(''); setCryptoPreset('');
    setQuantity(''); setPricePerUnit(''); setPurchaseDate(new Date().toISOString().split('T')[0]);
  }

  async function handleSave() {
    if (!name || !assetType) return;
    setSaving(true);
    try {
      const lot = quantity && pricePerUnit && purchaseDate
        ? { quantity: Number(quantity), price_per_unit: Number(pricePerUnit), purchase_date: purchaseDate }
        : undefined;

      const res = await fetch('/api/investments/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          name,
          ticker: ticker || null,
          asset_type: assetType,
          is_public: isPublic,
          provider_id: assetType === 'crypto' ? providerId || null : null,
          currency,
          notes: notes || null,
          lot,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create asset');
      }

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Asset Type */}
          <div className="space-y-1.5">
            <Label>Asset Type</Label>
            <Select value={assetType} onValueChange={v => { setAssetType(v); if (v !== 'crypto') { setProviderId(''); setCryptoPreset(''); } }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{ASSET_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Crypto Preset */}
          {assetType === 'crypto' && (
            <div className="space-y-1.5">
              <Label>Cryptocurrency</Label>
              <Select value={cryptoPreset} onValueChange={handleCryptoPreset}>
                <SelectTrigger><SelectValue placeholder="Select or enter custom..." /></SelectTrigger>
                <SelectContent>
                  {TOP_CRYPTOS.map(c => (
                    <SelectItem key={c.providerId} value={c.providerId}>
                      {c.ticker} — {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apple Inc." />
          </div>

          {/* Ticker */}
          <div className="space-y-1.5">
            <Label>Ticker {isPublic ? '' : '(optional)'}</Label>
            <Input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
            />
          </div>

          {/* CoinGecko ID for crypto */}
          {assetType === 'crypto' && cryptoPreset === 'custom' && (
            <div className="space-y-1.5">
              <Label>CoinGecko ID</Label>
              <Input
                value={providerId}
                onChange={e => setProviderId(e.target.value.toLowerCase())}
                placeholder="e.g. bitcoin"
              />
              <p className="text-xs text-muted-foreground">Find IDs at coingecko.com</p>
            </div>
          )}

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <Label>Public (auto-fetch price)</Label>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Initial Purchase (optional)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price/Unit</Label>
                <Input
                  type="number"
                  step="any"
                  value={pricePerUnit}
                  onChange={e => setPricePerUnit(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
