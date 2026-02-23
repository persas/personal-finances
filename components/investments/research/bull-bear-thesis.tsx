'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

export function BullBearThesis({ content }: Props) {
  const { thesis } = content;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Bull Case */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-emerald-500" />
          <CardHeader className="pb-2 pl-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Bull Case</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-6">
            {thesis.bullCase.split('\n').filter(p => p.trim()).map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">{p}</p>
            ))}
          </CardContent>
        </Card>

        {/* Bear Case */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-red-500" />
          <CardHeader className="pb-2 pl-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Bear Case</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pl-6">
            {thesis.bearCase.split('\n').filter(p => p.trim()).map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">{p}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Catalysts & Fair Value */}
      <div className="grid gap-4 lg:grid-cols-2">
        {thesis.catalysts.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-medium">Upcoming Catalysts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {thesis.catalysts.map((catalyst, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="text-amber-500 mt-1 shrink-0">•</span>
                    {catalyst}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {thesis.fairValueEstimate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Fair Value Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              {thesis.fairValueEstimate.split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">{p}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
