'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, MapPin } from 'lucide-react';
import type { ResearchContent } from '@/lib/types';

interface Props {
  content: ResearchContent;
}

export function BusinessOverview({ content }: Props) {
  const { business } = content;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Left: AI analysis */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Business Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground/90">{business.description}</p>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Competitive Moat
              </h4>
              <Badge variant="outline" className="mb-2">{business.moatType}</Badge>
              <p className="text-sm leading-relaxed text-foreground/90">{business.moatAnalysis}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Competitive Landscape
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">{business.competitiveLandscape}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Market Size (TAM/SAM/SOM)
              </h4>
              <p className="text-sm leading-relaxed text-foreground/90">{business.tamSamSom}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Company profile facts */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {business.sector && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Sector:</span>
                <span className="font-medium">{business.sector}</span>
              </div>
            )}
            {business.industry && business.industry !== business.sector && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Industry:</span>
                <span className="font-medium">{business.industry}</span>
              </div>
            )}
            {business.country && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Country:</span>
                <span className="font-medium">{business.country}</span>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Industry Cycle</p>
              <p className="text-sm">{business.industryCyclePosition}</p>
            </div>

            {business.peers.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Peers</p>
                <div className="flex flex-wrap gap-1">
                  {business.peers.map(peer => (
                    <Badge key={peer} variant="outline" className="text-xs font-mono">
                      {peer}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
