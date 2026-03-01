'use client';

import { useState, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, Loader2, Check, X, FileSpreadsheet, Sparkles, AlertTriangle } from 'lucide-react';
import type { ParsedTransaction } from '@/lib/types';
import { BUDGET_GROUPS } from '@/lib/categories';
import * as XLSX from 'xlsx';

export default function UploadPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Duplicate detection state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<ParsedTransaction[]>([]);
  const [nonDuplicates, setNonDuplicates] = useState<ParsedTransaction[]>([]);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setTransactions([]);
    setError(null);

    const isXlsx = f.name.endsWith('.xlsx') || f.name.endsWith('.xls');

    if (isXlsx) {
      try {
        const buffer = await f.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const text = XLSX.utils.sheet_to_csv(sheet, { FS: ';' });
        setCsvText(text);
      } catch {
        setError('Failed to read XLSX file. Make sure it is a valid spreadsheet.');
        setCsvText('');
      }
    } else {
      const text = await f.text();
      setCsvText(text);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) {
      handleFile(f);
    }
  }, [handleFile]);

  const handleProcess = async () => {
    if (!csvText) return;
    setLoading(true);
    setError(null);
    setTransactions([]);
    try {
      const res = await fetch('/api/parse-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile, csvText, year }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);
      if (!data.transactions || data.transactions.length === 0) {
        setError('Gemini returned 0 transactions. Check that the file contains valid bank statement data.');
        return;
      }
      setTransactions(data.transactions);
      toast.success(`Parsed ${data.transactions.length} transactions`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!transactions.length) return;
    setSaving(true);
    try {
      // Check for duplicates first
      const checkRes = await fetch('/api/transactions/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile, transactions }),
      });
      const checkData = await checkRes.json();

      if (checkData.duplicates?.length > 0) {
        setDuplicates(checkData.duplicates);
        setNonDuplicates(checkData.newTransactions);
        setDuplicateDialogOpen(true);
        setSaving(false);
        return;
      }

      // No duplicates — save all
      await saveTransactions(transactions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
      setSaving(false);
    }
  };

  const saveTransactions = async (txsToSave: ParsedTransaction[]) => {
    if (!txsToSave.length) {
      toast.error('No transactions to save');
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      const source = txsToSave[0]?.source || 'Unknown';
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile,
          transactions: txsToSave,
          filename: file?.name || 'upload.csv',
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Saved ${data.count} transactions`);

      // Determine month from first transaction for redirect
      const firstDate = new Date(txsToSave[0].date);
      const month = firstDate.getMonth() + 1;
      router.push(`/${profile}?month=${month}&year=${firstDate.getFullYear()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithoutDuplicates = () => {
    setDuplicateDialogOpen(false);
    setTransactions(nonDuplicates);
    saveTransactions(nonDuplicates);
  };

  const updateTransaction = (idx: number, field: keyof ParsedTransaction, value: string) => {
    setTransactions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: field === 'amount' ? Number(value) : value };
      return updated;
    });
  };

  const removeTransaction = (idx: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== idx));
  };

  const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

  return (
    <div className="flex flex-col">
      <Header
        title="Upload Statement"
        subtitle={`${profileNames[profile] || profile} — Upload bank CSV or XLSX for processing`}
        showYearPicker
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Drop Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              File Upload
            </CardTitle>
            <CardDescription>
              Drop a bank statement (CSV or XLSX). Gemini will auto-detect the bank format, parse, and categorize.
              The file can contain multiple months — dates are used to assign each transaction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12 text-center transition-colors hover:border-primary/50"
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">
                {file ? file.name : 'Drag & drop your CSV or XLSX here'}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Supports BBVA, Revolut, AMEX, and any other bank format
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="max-w-xs"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {file && (
              <div className="mt-4 flex items-center gap-3">
                <Badge variant="secondary">{file.name}</Badge>
                <span className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <Button onClick={handleProcess} disabled={loading || !csvText} className="ml-auto">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing with Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Process with Gemini
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <X className="mt-0.5 h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Processing Error</p>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Table */}
        {transactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Review Transactions ({transactions.length})</CardTitle>
                  <CardDescription>
                    Click any row to edit. Review categories and budget mappings before saving.
                  </CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Save {transactions.length} Transactions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[90px]">Amount</TableHead>
                      <TableHead className="w-[90px]">Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Budget Group</TableHead>
                      <TableHead>Budget Line</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx, idx) => (
                      <TableRow
                        key={idx}
                        className="cursor-pointer"
                        onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      >
                        <TableCell className="font-mono text-xs">{tx.date}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {editingIdx === idx ? (
                            <Input
                              value={tx.description}
                              onChange={e => updateTransaction(idx, 'description', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="h-7 text-xs"
                            />
                          ) : tx.description}
                        </TableCell>
                        <TableCell className={`font-mono text-sm font-medium ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {editingIdx === idx ? (
                            <Select value={tx.type} onValueChange={v => updateTransaction(idx, 'type', v)}>
                              <SelectTrigger className="h-7 text-xs" onClick={e => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['expense', 'income', 'transfer', 'internal', 'credit'].map(t => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={tx.type === 'expense' ? 'destructive' : tx.type === 'income' ? 'default' : 'secondary'} className="text-xs">
                              {tx.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{tx.source}</TableCell>
                        <TableCell>
                          {editingIdx === idx ? (
                            <Input
                              value={tx.category}
                              onChange={e => updateTransaction(idx, 'category', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="h-7 text-xs"
                            />
                          ) : (
                            <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIdx === idx ? (
                            <Select value={tx.budget_group} onValueChange={v => updateTransaction(idx, 'budget_group', v)}>
                              <SelectTrigger className="h-7 text-xs" onClick={e => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[...BUDGET_GROUPS, 'Income', 'Transfer', 'Internal'].map(g => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground">{tx.budget_group}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {editingIdx === idx ? (
                            <Input
                              value={tx.budget_line}
                              onChange={e => updateTransaction(idx, 'budget_line', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              className="h-7 text-xs"
                            />
                          ) : tx.budget_line}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => { e.stopPropagation(); removeTransaction(idx); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Duplicate Warning Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Duplicate Transactions Detected
            </DialogTitle>
            <DialogDescription>
              {duplicates.length} transaction{duplicates.length !== 1 ? 's' : ''} already exist in the database
              and will be skipped. {nonDuplicates.length} new transaction{nonDuplicates.length !== 1 ? 's' : ''} will be saved.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[90px]">Amount</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((tx, idx) => (
                  <TableRow key={idx} className="text-muted-foreground">
                    <TableCell className="font-mono text-xs">{tx.date}</TableCell>
                    <TableCell className="text-sm truncate max-w-[250px]">{tx.description}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{tx.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            {nonDuplicates.length > 0 ? (
              <Button onClick={handleSaveWithoutDuplicates}>
                <Check className="mr-2 h-4 w-4" />
                Save {nonDuplicates.length} New Transaction{nonDuplicates.length !== 1 ? 's' : ''}
              </Button>
            ) : (
              <Button disabled>
                All transactions are duplicates
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
