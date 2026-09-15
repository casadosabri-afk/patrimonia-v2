'use client';

import { useState } from 'react';
import type { Insight } from '@/types';
import { Card, EmptyState, SegmentedControl, DisclaimerNote } from '@/components/ui';
import { InsightCard } from '@/components/intelligence/InsightCard';

type Filter = 'tous' | 'risque' | 'opportunite' | 'information' | 'action';

export function InsightsSection({ insights, focus }: { insights: Insight[]; focus?: Insight['kind'] }) {
  const [filter, setFilter] = useState<Filter>(focus ?? 'tous');
  const visible = filter === 'tous' ? insights : insights.filter((item) => item.kind === filter);

  const count = (kind: Insight['kind']) => insights.filter((item) => item.kind === kind).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">PATRIMONIA INTELLIGENCE</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {insights.length} élément{insights.length > 1 ? 's' : ''} détecté{insights.length > 1 ? 's' : ''} sur ce
            dossier.
          </p>
        </div>
        <SegmentedControl
          options={[
            { value: 'tous', label: `Tous (${insights.length})` },
            { value: 'risque', label: `Risques (${count('risque')})` },
            { value: 'opportunite', label: `Opportunités (${count('opportunite')})` },
            { value: 'information', label: `Informations (${count('information')})` },
            { value: 'action', label: `Actions (${count('action')})` },
          ]}
          value={filter}
          onChange={(value) => setFilter(value as Filter)}
        />
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun élément dans cette catégorie"
            description="L’analyse n’a rien relevé de significatif pour ce filtre."
          />
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      <DisclaimerNote>
        Ces éléments sont des aides à l’analyse produites automatiquement à partir des données du dossier. Ils
        ont une vocation pédagogique et ne constituent pas une recommandation personnalisée ni un conseil en
        investissement au sens réglementaire.
      </DisclaimerNote>
    </div>
  );
}
