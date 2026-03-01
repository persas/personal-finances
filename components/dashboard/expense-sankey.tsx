'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyNode,
  type SankeyLink,
} from 'd3-sankey';
import { getBudgetGroupColor } from '@/lib/categories';

interface SankeyData {
  budgetGroupSummary: Array<{ group: string; spentYTD: number }>;
  annualBudgetBurn: Array<{ group: string; line: string; spentYTD: number }>;
  totalIncome: number;
}

interface SNode {
  name: string;
  category: 'income' | 'group' | 'line' | 'remainder';
  group?: string;
}

interface SLink {
  source: number;
  target: number;
  value: number;
}

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Margins for labels: left for income/group labels, right for line labels
const MARGIN_LEFT = 130;
const MARGIN_RIGHT = 170;
const INNER_WIDTH = 900;
const TOTAL_WIDTH = MARGIN_LEFT + INNER_WIDTH + MARGIN_RIGHT;

export function ExpenseSankey({ data }: { data: SankeyData }) {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const layout = useMemo(() => {
    const nodeList: SNode[] = [];
    const linkList: SLink[] = [];
    const nodeIndex = new Map<string, number>();

    const totalSpent = data.budgetGroupSummary
      .filter(g => g.spentYTD > 0)
      .reduce((sum, g) => sum + g.spentYTD, 0);
    const remainder = Math.max(0, data.totalIncome - totalSpent);

    // Node 0: Income (full amount)
    nodeList.push({ name: 'Ingresos', category: 'income' });
    nodeIndex.set('income', 0);

    // Group nodes (level 1) — only groups with spending
    const groups = data.budgetGroupSummary.filter(g => g.spentYTD > 0);
    for (const g of groups) {
      const idx = nodeList.length;
      nodeList.push({ name: g.group, category: 'group' });
      nodeIndex.set(`group:${g.group}`, idx);
      linkList.push({ source: 0, target: idx, value: g.spentYTD });
    }

    // Remainder node — unspent income
    if (remainder > 0) {
      const idx = nodeList.length;
      nodeList.push({ name: 'Remanente', category: 'remainder' });
      nodeIndex.set('remainder', idx);
      linkList.push({ source: 0, target: idx, value: remainder });
    }

    // Line nodes (level 2) — only lines with spending
    const lines = data.annualBudgetBurn.filter(l => l.spentYTD > 0);
    for (const l of lines) {
      const groupIdx = nodeIndex.get(`group:${l.group}`);
      if (groupIdx === undefined) continue;
      const lineKey = `line:${l.group}:${l.line}`;
      let lineIdx = nodeIndex.get(lineKey);
      if (lineIdx === undefined) {
        lineIdx = nodeList.length;
        nodeList.push({ name: l.line, category: 'line', group: l.group });
        nodeIndex.set(lineKey, lineIdx);
      }
      linkList.push({ source: groupIdx, target: lineIdx, value: l.spentYTD });
    }

    if (nodeList.length < 3 || linkList.length === 0) return null;

    const lineCount = lines.length + (remainder > 0 ? 1 : 0);
    const height = Math.max(400, lineCount * 28 + 40);

    const sankeyGen = d3Sankey<SNode, SLink>()
      .nodeWidth(18)
      .nodePadding(10)
      .extent([[MARGIN_LEFT, 10], [MARGIN_LEFT + INNER_WIDTH, height - 10]]);

    const result = sankeyGen({
      nodes: nodeList.map(n => ({ ...n })),
      links: linkList.map(l => ({ ...l })),
    });

    return { ...result, height };
  }, [data]);

  if (!layout) return null;

  const { nodes, links, height } = layout;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Flow — YTD</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${TOTAL_WIDTH} ${height}`}
            className="w-full"
            style={{ minWidth: 500 }}
          >
            {/* Links */}
            {links.map((link, i) => {
              const source = link.source as SankeyNode<SNode, SLink>;
              const target = link.target as SankeyNode<SNode, SLink>;
              let color: string;
              if (target.category === 'remainder') {
                color = '#10b981';
              } else if (source.category === 'income') {
                color = getBudgetGroupColor(target.name);
              } else {
                color = getBudgetGroupColor(source.name);
              }
              const d = sankeyLinkHorizontal()(link as never);
              if (!d) return null;
              return (
                <path
                  key={`link-${i}`}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={Math.max(1, (link as { width?: number }).width ?? 1)}
                  strokeOpacity={hoveredLink === i ? 0.65 : 0.3}
                  onMouseEnter={() => setHoveredLink(i)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="transition-opacity duration-150"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const n = node as SankeyNode<SNode, SLink>;
              const x0 = n.x0 ?? 0;
              const y0 = n.y0 ?? 0;
              const x1 = n.x1 ?? 0;
              const y1 = n.y1 ?? 0;
              const nodeHeight = y1 - y0;

              let color: string;
              if (n.category === 'income') {
                color = '#10b981';
              } else if (n.category === 'remainder') {
                color = '#10b981';
              } else if (n.category === 'group') {
                color = getBudgetGroupColor(n.name);
              } else {
                color = getBudgetGroupColor(n.group ?? '');
              }

              // Labels: income & group on the left of the node, line & remainder on the right
              const isRightLabel = n.category === 'line' || n.category === 'remainder';
              const labelX = isRightLabel ? x1 + 6 : x0 - 6;
              const anchor = isRightLabel ? 'start' : 'end';
              const fontSize = nodeHeight < 14 ? 9 : 11;

              return (
                <g key={`node-${i}`}>
                  <rect
                    x={x0}
                    y={y0}
                    width={x1 - x0}
                    height={nodeHeight}
                    fill={color}
                    rx={3}
                  />
                  <text
                    x={labelX}
                    y={(y0 + y1) / 2}
                    dy="0.35em"
                    textAnchor={anchor}
                    className="fill-foreground"
                    style={{ fontSize }}
                  >
                    {n.name} ({fmt(n.value ?? 0)}&euro;)
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
