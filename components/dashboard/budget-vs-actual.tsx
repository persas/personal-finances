'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getBudgetGroupColor } from '@/lib/categories';
import type { BudgetGroupSummary, BudgetLineSummary } from '@/lib/types';

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  groups: BudgetGroupSummary[];
  lines: BudgetLineSummary[];
}

export function BudgetVsActual({ groups, lines }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget vs Actual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Group summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {groups.map(g => {
            const pct = g.budget > 0 ? Math.min((g.actual / g.budget) * 100, 100) : 0;
            const isOver = g.delta > 0;
            const color = getBudgetGroupColor(g.group);
            return (
              <div
                key={g.group}
                className="rounded-lg border p-4 text-center"
              >
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color }}>
                  {g.group}
                </p>
                <p className={`mt-2 text-xl font-bold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                  {fmt(g.actual)}€
                </p>
                <Progress value={pct} className="mt-3 h-1.5" />
                <p className={`mt-2 text-xs font-semibold ${isOver ? 'text-red-400' : 'text-green-400'}`}>
                  {g.delta >= 0 ? '+' : ''}{fmt(g.delta)}€ vs {fmt(g.budget)}€
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed line table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Budget Line</TableHead>
              <TableHead className="text-right">Budgeted</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead className="w-[150px]">Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              let currentGroup = '';
              const rows: React.ReactNode[] = [];
              for (const line of lines) {
                if (line.group !== currentGroup) {
                  currentGroup = line.group;
                  const groupData = groups.find(g => g.group === line.group);
                  rows.push(
                    <TableRow key={`grp-${line.group}`} className="bg-muted/50">
                      <TableCell colSpan={6} className="font-bold" style={{ color: getBudgetGroupColor(line.group) }}>
                        {line.group} — Budget: {fmt(groupData?.budget || 0)}€ | Actual: {fmt(groupData?.actual || 0)}€
                      </TableCell>
                    </TableRow>
                  );
                }
                const pct = line.budget > 0 ? Math.min((line.actual / line.budget) * 100, 200) : 0;
                const isOver = line.delta > 5;
                const isUnder = line.delta < -5;
                rows.push(
                  <TableRow key={`${line.group}-${line.line}`}>
                    <TableCell className="pl-6">{line.line}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(line.budget)}€</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{fmt(line.actual)}€</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${isOver ? 'text-red-400' : isUnder ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {line.delta >= 0 ? '+' : ''}{fmt(line.delta)}€
                    </TableCell>
                    <TableCell>
                      <Progress value={Math.min(pct, 100)} className="h-2" />
                    </TableCell>
                    <TableCell>
                      {line.actual === 0 && line.budget > 0 ? (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      ) : isOver ? (
                        <span className="text-xs font-semibold text-red-400">Over</span>
                      ) : isUnder ? (
                        <span className="text-xs font-semibold text-green-400">Under</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">On budget</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }
              return rows;
            })()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
