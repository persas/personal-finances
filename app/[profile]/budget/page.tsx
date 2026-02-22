'use client';

import React, { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import type { BudgetLine } from '@/lib/types';
import { BUDGET_GROUPS, getBudgetGroupColor } from '@/lib/categories';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BudgetPage({ params }: { params: Promise<{ profile: string }> }) {
  const { profile } = use(params);
  const searchParams = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();

  const [budgets, setBudgets] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);

  // Form state
  const [formGroup, setFormGroup] = useState<string>('Fixed Costs');
  const [formName, setFormName] = useState('');
  const [formMonthly, setFormMonthly] = useState('');
  const [formAnnual, setFormAnnual] = useState('');
  const [formIsAnnual, setFormIsAnnual] = useState(false);

  const profileNames: Record<string, string> = { diego: 'Diego', marta: 'Marta', casa: 'Casa' };

  const fetchBudgets = () => {
    setLoading(true);
    fetch(`/api/budgets?profileId=${profile}&year=${year}`)
      .then(res => res.json())
      .then(data => setBudgets(data.budgets || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBudgets(); }, [profile, year]);

  const openNew = () => {
    setEditingLine(null);
    setFormGroup('Fixed Costs');
    setFormName('');
    setFormMonthly('');
    setFormAnnual('');
    setFormIsAnnual(false);
    setDialogOpen(true);
  };

  const openEdit = (line: BudgetLine) => {
    setEditingLine(line);
    setFormGroup(line.budget_group);
    setFormName(line.line_name);
    setFormMonthly(String(line.monthly_amount));
    setFormAnnual(String(line.annual_amount));
    setFormIsAnnual(line.is_annual);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const monthly = Number(formMonthly) || 0;
    const annual = Number(formAnnual) || monthly * 12;

    const body = editingLine
      ? { id: editingLine.id, budget_group: formGroup, line_name: formName, monthly_amount: monthly, annual_amount: annual, is_annual: formIsAnnual }
      : { profile_id: profile, budget_group: formGroup, line_name: formName, monthly_amount: monthly, annual_amount: annual, is_annual: formIsAnnual, year };

    const res = await fetch('/api/budgets', {
      method: editingLine ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success(editingLine ? 'Budget line updated' : 'Budget line created');
      setDialogOpen(false);
      fetchBudgets();
    } else {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Budget line deleted');
      fetchBudgets();
    } else {
      toast.error('Failed to delete');
    }
  };

  // Group budgets
  const grouped: Record<string, BudgetLine[]> = {};
  for (const b of budgets) {
    if (!grouped[b.budget_group]) grouped[b.budget_group] = [];
    grouped[b.budget_group].push(b);
  }

  const totalMonthly = budgets.reduce((s, b) => s + Number(b.monthly_amount), 0);
  const totalAnnual = budgets.reduce((s, b) => s + Number(b.annual_amount), 0);

  return (
    <div className="flex flex-col">
      <Header
        title={`${profileNames[profile]} — Budget`}
        subtitle={`Year ${year}`}
        showYearPicker
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Monthly</p>
              <p className="mt-1 text-2xl font-bold">{fmt(totalMonthly)}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Annual</p>
              <p className="mt-1 text-2xl font-bold">{fmt(totalAnnual)}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Budget Lines</p>
              <p className="mt-1 text-2xl font-bold">{budgets.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Budget Configuration</CardTitle>
                <CardDescription>Monthly and annual budgets by category</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingLine ? 'Edit Budget Line' : 'New Budget Line'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Budget Group</Label>
                      <Select value={formGroup} onValueChange={setFormGroup}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BUDGET_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Line Name</Label>
                      <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Rent / Mortgage" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Monthly (€)</Label>
                        <Input type="number" value={formMonthly} onChange={e => {
                          setFormMonthly(e.target.value);
                          if (!formIsAnnual) setFormAnnual(String(Number(e.target.value) * 12));
                        }} />
                      </div>
                      <div>
                        <Label>Annual (€)</Label>
                        <Input type="number" value={formAnnual} onChange={e => {
                          setFormAnnual(e.target.value);
                          if (formIsAnnual) setFormMonthly(String((Number(e.target.value) / 12).toFixed(2)));
                        }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={formIsAnnual} onCheckedChange={setFormIsAnnual} />
                      <Label>Annual expense (amortized monthly)</Label>
                    </div>
                    <Button className="w-full" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      {editingLine ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Line Name</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Annual</TableHead>
                    <TableHead>Annual?</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([group, lines]) => (
                    <React.Fragment key={group}>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="font-bold" style={{ color: getBudgetGroupColor(group) }}>
                          {group} — {fmt(lines.reduce((s, l) => s + Number(l.monthly_amount), 0))}€/mo
                        </TableCell>
                      </TableRow>
                      {lines.map(line => (
                        <TableRow key={line.id}>
                          <TableCell className="pl-6">{line.line_name}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(Number(line.monthly_amount))}€</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(Number(line.annual_amount))}€</TableCell>
                          <TableCell>{line.is_annual ? '✓' : ''}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(line)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(line.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
