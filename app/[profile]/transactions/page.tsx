'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Loader2, Search, Pencil, Check, X, Copy, Replace } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, BudgetLine } from '@/lib/types';
import { getCategoryColor, BUDGET_GROUPS, TRANSACTION_TYPES } from '@/lib/categories';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface DuplicateGroup {
  key: string;
  date: string;
  amount: number;
  description: string;
  transactions: Transaction[];
}

export default function TransactionsPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  const year = searchParams.get('year') || String(new Date().getFullYear());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterBG, setFilterBG] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');

  // Inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string | number>>({});
  const [saving, setSaving] = useState(false);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);

  // Find & Replace dialog
  const [showReplace, setShowReplace] = useState(false);
  const [replaceField, setReplaceField] = useState('source');
  const [replaceFind, setReplaceFind] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [fieldValues, setFieldValues] = useState<{ value: string; count: number }[]>([]);

  // Deduplication dialog
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<number>>(new Set());
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [deletingDuplicates, setDeletingDuplicates] = useState(false);

  const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

  // Fetch transactions
  const fetchTransactions = () => {
    setLoading(true);
    const p = new URLSearchParams({ profileId: profile, year });
    if (month) p.set('month', month);
    fetch(`/api/transactions?${p}`)
      .then(res => res.json())
      .then(data => setTransactions(data.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, [profile, month, year]);

  // Fetch budget lines
  useEffect(() => {
    fetch(`/api/budgets?profileId=${profile}&year=${year}`)
      .then(res => res.json())
      .then(data => setBudgetLines(data.budgets || []))
      .catch(console.error);
  }, [profile, year]);

  const budgetLinesByGroup = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const bl of budgetLines) {
      if (!map[bl.budget_group]) map[bl.budget_group] = [];
      map[bl.budget_group].push(bl.line_name);
    }
    return map;
  }, [budgetLines]);

  const existingCategories = useMemo(() =>
    [...new Set(transactions.map(t => t.category).filter(Boolean))] as string[],
    [transactions]
  );

  const sources = useMemo(() => [...new Set(transactions.map(t => t.source).filter(Boolean))], [transactions]);
  const budgetGroupsInData = useMemo(() => [...new Set(transactions.map(t => t.budget_group).filter(Boolean))], [transactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (filterType !== 'all') {
      if (filterType === 'expense') {
        result = result.filter(t => t.type === 'expense' || t.type === 'credit');
      } else {
        result = result.filter(t => t.type === filterType);
      }
    }
    if (filterSource !== 'all') result = result.filter(t => t.source === filterSource);
    if (filterBG !== 'all') result = result.filter(t => t.budget_group === filterBG);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        `${t.description} ${t.category} ${t.notes} ${t.source} ${t.budget_group} ${t.budget_line}`.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return a.date.localeCompare(b.date);
        case 'date-desc': return b.date.localeCompare(a.date);
        case 'amount-desc': return Number(b.amount) - Number(a.amount);
        case 'amount-asc': return Number(a.amount) - Number(b.amount);
        default: return 0;
      }
    });
    return result;
  }, [transactions, filterType, filterSource, filterBG, search, sortBy]);

  const totalFiltered = useMemo(() => {
    return filtered.reduce((sum, t) => {
      if (t.type === 'income') return sum + Number(t.amount);
      if (t.type === 'expense') return sum - Number(t.amount);
      if (t.type === 'credit') return sum + Number(t.amount);
      return sum;
    }, 0);
  }, [filtered]);

  // Inline editing
  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setEditFields({
      category: tx.category || '',
      budget_group: tx.budget_group || '',
      budget_line: tx.budget_line || '',
      type: tx.type,
      notes: tx.notes || '',
      description: tx.description,
      amount: Number(tx.amount),
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditFields({}); };

  const saveEdit = async () => {
    if (editingId === null) return;
    setSaving(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editFields }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      setTransactions(prev =>
        prev.map(t => t.id === editingId ? { ...t, ...editFields, amount: Number(editFields.amount) } : t) as Transaction[]
      );
      toast.success('Transaction updated');
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const isEditing = (txId: number) => editingId === txId;
  const editBudgetLines = useMemo(() => budgetLinesByGroup[String(editFields.budget_group || '')] || [], [editFields.budget_group, budgetLinesByGroup]);

  // Find & Replace
  const openReplace = async () => {
    setShowReplace(true);
    setReplaceFind('');
    setReplaceWith('');
    // Fetch unique values for the default field
    await fetchFieldValues('source');
  };

  const fetchFieldValues = async (field: string) => {
    try {
      const res = await fetch(`/api/transactions/bulk?profileId=${profile}&field=${field}&year=${year}`);
      const data = await res.json();
      setFieldValues(data.values || []);
    } catch { setFieldValues([]); }
  };

  const handleReplaceFieldChange = (field: string) => {
    setReplaceField(field);
    setReplaceFind('');
    setReplaceWith('');
    fetchFieldValues(field);
  };

  const executeReplace = async () => {
    if (!replaceFind || !replaceWith) return;
    setReplaceLoading(true);
    try {
      const res = await fetch('/api/transactions/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile, field: replaceField, oldValue: replaceFind, newValue: replaceWith, year: Number(year) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Updated ${data.updated} transactions`);
      setShowReplace(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setReplaceLoading(false);
    }
  };

  const replaceMatchCount = useMemo(() => {
    if (!replaceFind) return 0;
    return fieldValues.find(v => v.value === replaceFind)?.count || 0;
  }, [replaceFind, fieldValues]);

  // Deduplication
  const openDuplicates = async () => {
    setLoadingDuplicates(true);
    setShowDuplicates(true);
    try {
      const res = await fetch(`/api/transactions/duplicates?profileId=${profile}&year=${year}`);
      const data = await res.json();
      setDuplicateGroups(data.groups || []);
      // Pre-select newer duplicates for deletion (keep oldest = lowest id)
      const toDelete = new Set<number>();
      for (const group of data.groups || []) {
        const sorted = [...group.transactions].sort((a: Transaction, b: Transaction) => a.id - b.id);
        for (let i = 1; i < sorted.length; i++) {
          toDelete.add(sorted[i].id);
        }
      }
      setSelectedForDeletion(toDelete);
    } catch (err) {
      toast.error('Failed to find duplicates');
      setShowDuplicates(false);
    } finally {
      setLoadingDuplicates(false);
    }
  };

  const toggleDeletionSelection = (id: number) => {
    setSelectedForDeletion(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteDuplicates = async () => {
    if (selectedForDeletion.size === 0) return;
    setDeletingDuplicates(true);
    try {
      const res = await fetch('/api/transactions/duplicates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedForDeletion) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Deleted ${data.deleted} duplicate transactions`);
      setShowDuplicates(false);
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingDuplicates(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['Date', 'Source', 'Description', 'Category', 'Budget Group', 'Budget Line', 'Amount', 'Type', 'Notes'];
    const rows = filtered.map(t => [
      t.date, t.source,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category, t.budget_group, t.budget_line,
      (t.type === 'income' || t.type === 'credit' ? Number(t.amount) : -Number(t.amount)).toFixed(2),
      t.type, `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${profile}_${year}${month ? '_' + month : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      <Header
        title={`${profileNames[profile]} — Transactions`}
        subtitle={month ? `Month ${month}, ${year}` : `Year ${year}`}
        showMonthPicker
      />

      <div className="p-6 lg:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Transactions</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={openDuplicates}>
                  <Copy className="mr-2 h-4 w-4" />
                  Find Duplicates
                </Button>
                <Button variant="outline" size="sm" onClick={openReplace}>
                  <Replace className="mr-2 h-4 w-4" />
                  Find & Replace
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterBG} onValueChange={setFilterBG}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {budgetGroupsInData.map(g => <SelectItem key={g!} value={g!}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date ↑</SelectItem>
                  <SelectItem value="date-desc">Date ↓</SelectItem>
                  <SelectItem value="amount-desc">Amount ↓</SelectItem>
                  <SelectItem value="amount-asc">Amount ↑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span>Showing {filtered.length} of {transactions.length} transactions</span>
              <span className={`font-bold ${totalFiltered >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                Net: {totalFiltered >= 0 ? '+' : ''}{fmt(totalFiltered)}&euro;
              </span>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="max-h-[700px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[90px]">Date</TableHead>
                      <TableHead className="w-[80px]">Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Budget Group</TableHead>
                      <TableHead>Budget Line</TableHead>
                      <TableHead className="text-right w-[100px]">Amount</TableHead>
                      <TableHead className="w-[90px]">Type</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(tx => (
                      <TableRow
                        key={tx.id}
                        className={`group ${tx.type === 'transfer' ? 'opacity-40' : tx.type === 'internal' ? 'opacity-30' : ''} ${isEditing(tx.id) ? 'bg-muted/50' : ''}`}
                      >
                        <TableCell className="font-mono text-xs whitespace-nowrap">{tx.date.split('-').reverse().join('/')}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{tx.source}</Badge></TableCell>
                        <TableCell className="max-w-[200px]">
                          {isEditing(tx.id) ? (
                            <Input value={String(editFields.description || '')} onChange={e => setEditFields(f => ({ ...f, description: e.target.value }))} className="h-7 text-xs" />
                          ) : (
                            <span className="truncate block text-sm">{tx.description}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            <>
                              <Input value={String(editFields.category || '')} onChange={e => setEditFields(f => ({ ...f, category: e.target.value }))} className="h-7 text-xs" list={`cat-${tx.id}`} placeholder="Category" />
                              <datalist id={`cat-${tx.id}`}>{existingCategories.map(c => <option key={c} value={c} />)}</datalist>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted" style={{ borderColor: getCategoryColor(tx.category || '') + '44', color: getCategoryColor(tx.category || '') }} onClick={() => startEdit(tx)}>
                              {tx.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            <Select value={String(editFields.budget_group || '')} onValueChange={v => setEditFields(f => ({ ...f, budget_group: v, budget_line: '' }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Group" /></SelectTrigger>
                              <SelectContent>{[...BUDGET_GROUPS, 'Income', 'Transfer', 'Internal'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => startEdit(tx)}>{tx.budget_group}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            editBudgetLines.length > 0 ? (
                              <Select value={String(editFields.budget_line || '')} onValueChange={v => setEditFields(f => ({ ...f, budget_line: v }))}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Line" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="—">— None</SelectItem>
                                  {editBudgetLines.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input value={String(editFields.budget_line || '')} onChange={e => setEditFields(f => ({ ...f, budget_line: e.target.value }))} className="h-7 text-xs" placeholder="Budget line" />
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => startEdit(tx)}>{tx.budget_line}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing(tx.id) ? (
                            <Input type="number" step="0.01" value={editFields.amount} onChange={e => setEditFields(f => ({ ...f, amount: Number(e.target.value) }))} className="h-7 text-xs text-right w-[90px]" />
                          ) : (
                            <span className={`font-mono text-sm font-medium ${tx.type === 'income' || tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'expense' ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{fmt(Number(tx.amount))}€
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            <Select value={String(editFields.type || '')} onValueChange={v => setEditFields(f => ({ ...f, type: v }))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{TRANSACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={tx.type === 'expense' ? 'destructive' : tx.type === 'income' ? 'default' : 'secondary'} className="text-xs">{tx.type}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            <Input value={String(editFields.notes || '')} onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))} className="h-7 text-xs" placeholder="Notes..." />
                          ) : (
                            <span className="max-w-[150px] truncate block text-xs text-muted-foreground">{tx.notes}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing(tx.id) ? (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={saveEdit} disabled={saving} className="h-7 w-7 p-0">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving} className="h-7 w-7 p-0">
                                <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => startEdit(tx)} className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Find & Replace Dialog */}
      <Dialog open={showReplace} onOpenChange={setShowReplace}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find & Replace</DialogTitle>
            <DialogDescription>Bulk update a field across all matching transactions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Field</label>
              <Select value={replaceField} onValueChange={handleReplaceFieldChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="budget_group">Budget Group</SelectItem>
                  <SelectItem value="budget_line">Budget Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Find (current value)</label>
              <Select value={replaceFind} onValueChange={setReplaceFind}>
                <SelectTrigger><SelectValue placeholder="Select value to replace..." /></SelectTrigger>
                <SelectContent>
                  {fieldValues.map(v => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.value} ({v.count} transactions)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Replace with</label>
              <Input value={replaceWith} onChange={e => setReplaceWith(e.target.value)} placeholder="New value..." />
            </div>
            {replaceFind && replaceWith && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                Will update <strong>{replaceMatchCount}</strong> transactions: <strong>{replaceField}</strong> from &quot;{replaceFind}&quot; → &quot;{replaceWith}&quot;
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplace(false)}>Cancel</Button>
            <Button onClick={executeReplace} disabled={!replaceFind || !replaceWith || replaceLoading}>
              {replaceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Replace className="mr-2 h-4 w-4" />}
              Replace {replaceMatchCount} Transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find Duplicates Dialog */}
      <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find Duplicates</DialogTitle>
            <DialogDescription>
              Transactions with the same date and amount. The oldest entry (lowest ID) is unchecked by default.
            </DialogDescription>
          </DialogHeader>
          {loadingDuplicates ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : duplicateGroups.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No duplicates found!</div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                Found <strong>{duplicateGroups.length}</strong> groups with potential duplicates.
                <strong> {selectedForDeletion.size}</strong> transactions selected for deletion.
              </div>
              {duplicateGroups.map(group => (
                <div key={group.key} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="outline">{group.date.split('-').reverse().join('/')}</Badge>
                    <span className="font-mono font-semibold">{fmt(group.amount)}€</span>
                    <span className="text-muted-foreground truncate">{group.description}</span>
                    <Badge className="ml-auto">{group.transactions.length}x</Badge>
                  </div>
                  <div className="space-y-1">
                    {[...group.transactions].sort((a, b) => a.id - b.id).map(tx => (
                      <div key={tx.id} className="flex items-center gap-3 rounded px-2 py-1 text-xs hover:bg-muted/50">
                        <Checkbox
                          checked={selectedForDeletion.has(tx.id)}
                          onCheckedChange={() => toggleDeletionSelection(tx.id)}
                        />
                        <span className="text-muted-foreground w-10">#{tx.id}</span>
                        <span className="truncate flex-1">{tx.description}</span>
                        <Badge variant="outline" className="text-xs">{tx.source}</Badge>
                        <span className="text-muted-foreground">{tx.category}</span>
                        <span className="text-muted-foreground">{tx.upload_batch_id?.substring(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicates(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={deleteDuplicates}
              disabled={selectedForDeletion.size === 0 || deletingDuplicates}
            >
              {deletingDuplicates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Delete {selectedForDeletion.size} Duplicates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
