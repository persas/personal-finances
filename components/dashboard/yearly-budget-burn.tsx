'use client';

import React from 'react';
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

interface BurnItem {
  group: string;
  line: string;
  annualBudget: number;
  spentYTD: number;
  percentUsed: number;
}

export function YearlyBudgetBurn({ data, year, monthsWithData }: { data: BurnItem[]; year: number; monthsWithData: number }) {
  const grouped: Record<string, BurnItem[]> = {};
  for (const item of data) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  }

  const expectedPct = (monthsWithData / 12) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Annual Budget Burn — {year}
          <span className="ml-3 text-xs font-normal text-muted-foreground">
            Expected pace: {expectedPct.toFixed(0)}% ({monthsWithData}/12 months)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Budget Line</TableHead>
              <TableHead className="text-right">Annual Budget</TableHead>
              <TableHead className="text-right">Spent YTD</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="w-[180px]">Burn Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([group, items]) => {
              const groupColor = getBudgetGroupColor(group);
              const zeroBudget = items.filter(i => i.annualBudget === 0);
              const withBudget = items.filter(i => i.annualBudget > 0);
              const [parent, ...rest] = withBudget;
              const hasSubcats = zeroBudget.length > 0 && !!parent;

              return (
                <React.Fragment key={group}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={6} className="font-bold" style={{ color: groupColor }}>
                      {group}
                    </TableCell>
                  </TableRow>

                  {/* Parent line with aggregated subcategories */}
                  {hasSubcats && (() => {
                    const childrenSpent = zeroBudget.reduce((sum, c) => sum + c.spentYTD, 0);
                    const aggregatedSpent = parent.spentYTD + childrenSpent;
                    const remaining = parent.annualBudget - aggregatedSpent;
                    const pctUsed = parent.annualBudget > 0 ? (aggregatedSpent / parent.annualBudget) * 100 : 0;
                    const isOverPace = pctUsed > expectedPct;
                    const isOverBudget = pctUsed > 100;
                    return (
                      <>
                        <TableRow key={`${parent.group}-${parent.line}`}>
                          <TableCell className="pl-6">{parent.line}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(parent.annualBudget)}&euro;</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">{fmt(aggregatedSpent)}&euro;</TableCell>
                          <TableCell className={`text-right font-mono text-sm font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {fmt(remaining)}&euro;
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ColoredProgress
                                value={pctUsed}
                                color={isOverBudget ? '#ef4444' : isOverPace ? '#f59e0b' : groupColor}
                              />
                              <span className="text-xs font-mono w-12 text-right text-muted-foreground">{pctUsed.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {aggregatedSpent === 0 ? (
                              <span className="text-xs text-muted-foreground">No data</span>
                            ) : isOverBudget ? (
                              <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Over budget</span>
                            ) : isOverPace ? (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Over pace</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">On track</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {/* Subcategories indented */}
                        {zeroBudget.filter(c => c.spentYTD !== 0).map(child => (
                          <TableRow key={`${child.group}-${child.line}`}>
                            <TableCell className="pl-10 text-sm text-muted-foreground">{child.line}</TableCell>
                            <TableCell className="text-right font-mono text-sm"><span className="text-muted-foreground">&mdash;</span></TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(child.spentYTD)}&euro;</TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell>
                              <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:text-violet-400">Tracking</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })()}

                  {/* Regular lines */}
                  {(hasSubcats ? rest : items).map(item => {
                    const remaining = item.annualBudget - item.spentYTD;
                    const isOverPace = item.percentUsed > expectedPct;
                    const isOverBudget = item.percentUsed > 100;
                    return (
                      <TableRow key={`${item.group}-${item.line}`}>
                        <TableCell className="pl-6">{item.line}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(item.annualBudget)}&euro;</TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{fmt(item.spentYTD)}&euro;</TableCell>
                        <TableCell className={`text-right font-mono text-sm font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {fmt(remaining)}&euro;
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ColoredProgress
                              value={item.percentUsed}
                              color={isOverBudget ? '#ef4444' : isOverPace ? '#f59e0b' : groupColor}
                            />
                            <span className="text-xs font-mono w-12 text-right text-muted-foreground">{item.percentUsed.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.spentYTD === 0 ? (
                            <span className="text-xs text-muted-foreground">No data</span>
                          ) : isOverBudget ? (
                            <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Over budget</span>
                          ) : isOverPace ? (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">Over pace</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">On track</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
