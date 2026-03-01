'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCategoryColor } from '@/lib/categories';
import type { Transaction } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  transactions: Transaction[];
  groupColor?: string;
}

export function TransactionDrawer({
  open,
  onOpenChange,
  title,
  subtitle,
  transactions,
  groupColor,
}: TransactionDrawerProps) {
  const isCredit = (t: Transaction) =>
    t.type === 'credit' || (t.type === 'income' && t.category === 'Reimbursement');

  const expenses = transactions.filter(t => !isCredit(t));
  const reimbursements = transactions.filter(t => isCredit(t));
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalReimbursements = reimbursements.reduce((s, t) => s + Number(t.amount), 0);
  const netAmount = totalExpenses - totalReimbursements;

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-hidden">
        <SheetHeader className="shrink-0">
          <SheetTitle style={{ color: groupColor }}>{title}</SheetTitle>
          {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>
              Gastos:{' '}
              <strong className="text-red-600 dark:text-red-400">{fmt(totalExpenses)}&euro;</strong>
            </span>
            {totalReimbursements > 0 && (
              <span>
                Reembolsos:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  -{fmt(totalReimbursements)}&euro;
                </strong>
              </span>
            )}
            <span>
              Neto: <strong>{fmt(netAmount)}&euro;</strong>
            </span>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 px-4 pb-4">
          <div className="space-y-1">
            {sorted.map(tx => {
              const isCreditTx = isCredit(tx);
              const catColor = getCategoryColor(tx.category || '');
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="w-[72px] shrink-0 font-mono text-xs text-muted-foreground">
                    {tx.date.slice(8)}/{tx.date.slice(5, 7)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{tx.description}</p>
                    <div className="mt-0.5 flex gap-1.5">
                      <span
                        className="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px]"
                        style={{ borderColor: catColor + '44', color: catColor }}
                      >
                        {tx.category}
                      </span>
                      {tx.budget_line && (
                        <span className="text-[10px] text-muted-foreground">
                          {tx.budget_line}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-sm font-semibold ${
                      isCreditTx
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isCreditTx ? '-' : ''}
                    {fmt(Number(tx.amount))}&euro;
                  </span>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay transacciones.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
