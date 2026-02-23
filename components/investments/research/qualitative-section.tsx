'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

const severityColors = {
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
};

export function QualitativeSection({ content }: Props) {
  const { qualitative } = content;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Moat & Management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Qualitative Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {qualitative.moatDurability && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Moat Durability
              </h4>
              {qualitative.moatDurability.split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">{p}</p>
              ))}
            </div>
          )}
          {qualitative.managementAssessment && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                Management
              </h4>
              {qualitative.managementAssessment.split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-2">{p}</p>
              ))}
            </div>
          )}
          {qualitative.esgConsiderations && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                ESG Considerations
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">{qualitative.esgConsiderations}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Table */}
      {qualitative.keyRisks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Key Risks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs w-20">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualitative.keyRisks.map((risk, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-xs">{risk.category}</Badge>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-foreground/90">
                      {risk.description}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className={`text-xs ${severityColors[risk.severity]}`}>
                        {risk.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
