'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

function ColoredProgress({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(value, 100)}%`,
          backgroundColor: color,
          opacity: 0.85,
        }}
      />
    </div>
  );
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {groups.map(g => {
            const pct = g.budget > 0 ? Math.min((g.actual / g.budget) * 100, 100) : 0;
            const isOver = g.delta > 0;
            const color = getBudgetGroupColor(g.group);
            return (
              <div
                key={g.group}
                className="relative overflow-hidden rounded-xl border p-4"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: color }}
                />
                <div className="pl-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                    {g.group}
                  </p>
                  <p className={`mt-2 text-xl font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {fmt(g.actual)}<span className="text-sm font-semibold opacity-70">&euro;</span>
                  </p>
                  <ColoredProgress value={pct} color={color} />
                  <p className={`mt-2 text-xs font-semibold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {g.delta >= 0 ? '+' : ''}{fmt(g.delta)}&euro; vs {fmt(g.budget)}&euro;
                  </p>
                </div>
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
                  const groupColor = getBudgetGroupColor(line.group);
                  rows.push(
                    <TableRow key={`grp-${line.group}`} className="bg-muted/50">
                      <TableCell colSpan={6} className="font-bold" style={{ color: groupColor }}>
                        {line.group} — Budget: {fmt(groupData?.budget || 0)}&euro; | Actual: {fmt(groupData?.actual || 0)}&euro;
                      </TableCell>
                    </TableRow>
                  );
                }
                const isTrackingOnly = line.budget === 0;
                const pct = line.budget > 0 ? Math.min((line.actual / line.budget) * 100, 200) : 0;
                const isOver = !isTrackingOnly && line.delta > 5;
                const isUnder = !isTrackingOnly && line.delta < -5;
                const groupColor = getBudgetGroupColor(line.group);
                // Hide tracking-only lines with no spending
                if (isTrackingOnly && line.actual === 0) continue;
                rows.push(
                  <TableRow key={`${line.group}-${line.line}`}>
                    <TableCell className="pl-6">{line.line}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{isTrackingOnly ? <span className="text-muted-foreground">—</span> : <>{fmt(line.budget)}&euro;</>}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">{fmt(line.actual)}&euro;</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${isOver ? 'text-red-600 dark:text-red-400' : isUnder ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {isTrackingOnly ? '' : <>{line.delta >= 0 ? '+' : ''}{fmt(line.delta)}&euro;</>}
                    </TableCell>
                    <TableCell>
                      {isTrackingOnly ? null : (
                        <ColoredProgress
                          value={Math.min(pct, 100)}
                          color={isOver ? '#ef4444' : groupColor}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isTrackingOnly ? (
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">Tracking</span>
                      ) : line.actual === 0 && line.budget > 0 ? (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      ) : isOver ? (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Over</span>
                      ) : isUnder ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Under</span>
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
