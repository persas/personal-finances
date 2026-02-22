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

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BurnItem {
  group: string;
  line: string;
  annualBudget: number;
  spentYTD: number;
  percentUsed: number;
}

export function YearlyBudgetBurn({ data, year }: { data: BurnItem[]; year: number }) {
  // Group items
  const grouped: Record<string, BurnItem[]> = {};
  for (const item of data) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  }

  const currentMonth = new Date().getMonth() + 1;
  const expectedPct = (currentMonth / 12) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Annual Budget Burn — {year}
          <span className="ml-3 text-xs font-normal text-muted-foreground">
            Expected pace: {expectedPct.toFixed(0)}% ({currentMonth}/12 months)
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
            {Object.entries(grouped).map(([group, items]) => (
              <>
                <TableRow key={`grp-${group}`} className="bg-muted/50">
                  <TableCell colSpan={6} className="font-bold" style={{ color: getBudgetGroupColor(group) }}>
                    {group}
                  </TableCell>
                </TableRow>
                {items.map(item => {
                  const remaining = item.annualBudget - item.spentYTD;
                  const isOverPace = item.percentUsed > expectedPct;
                  const isOverBudget = item.percentUsed > 100;
                  return (
                    <TableRow key={`${item.group}-${item.line}`}>
                      <TableCell className="pl-6">{item.line}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(item.annualBudget)}€</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmt(item.spentYTD)}€</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fmt(remaining)}€
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(item.percentUsed, 100)} className="h-2 flex-1" />
                          <span className="text-xs font-mono w-12 text-right">{item.percentUsed.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.spentYTD === 0 ? (
                          <span className="text-xs text-muted-foreground">No data</span>
                        ) : isOverBudget ? (
                          <span className="text-xs font-semibold text-red-400">Over budget</span>
                        ) : isOverPace ? (
                          <span className="text-xs font-semibold text-yellow-400">Over pace</span>
                        ) : (
                          <span className="text-xs font-semibold text-green-400">On track</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
