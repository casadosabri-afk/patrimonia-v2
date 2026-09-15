'use client';

import { Banknote, Building2, Coins, CreditCard, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import type { CoherenceScore, Client, Insight, Patrimony } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, MetricCard, DisclaimerNote } from '@/components/ui';
import { AllocationDonut } from '@/components/charts/AllocationDonut';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { InsightCard } from '@/components/intelligence/InsightCard';
import { ScoreBreakdown } from '@/components/intelligence/ScoreBreakdown';
import { formatEuro } from '@/lib/utils/format';

export function OverviewSection({
  client,
  patrimony,
  score,
  insights,
  onNavigate,
}: {
  client: Client;
  patrimony: Patrimony;
  score: CoherenceScore;
  insights: Insight[];
  onNavigate: (section: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Patrimoine net"
          value={formatEuro(patrimony.netWorth)}
          changePct={patrimony.yearPerformancePct}
          sublabel="sur douze mois"
          icon={Wallet}
          tone="accent"
        />
        <MetricCard label="Actif brut" value={formatEuro(patrimony.grossAssets)} icon={TrendingUp} />
        <MetricCard label="Endettement" value={formatEuro(patrimony.totalDebt)} icon={CreditCard} />
        <MetricCard label="Liquidités" value={formatEuro(patrimony.liquidity)} icon={Banknote} />
        <MetricCard label="Immobilier" value={formatEuro(patrimony.realEstateValue)} icon={Building2} />
        <MetricCard label="Placements financiers" value={formatEuro(patrimony.financialValue)} icon={Coins} />
        <MetricCard label="Autres actifs" value={formatEuro(patrimony.otherValue)} icon={PiggyBank} />
        <MetricCard
          label="Revenus annuels"
          value={formatEuro(client.annualIncome)}
          sublabel={`${formatEuro(client.annualExpenses)} de dépenses`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Évolution du patrimoine</CardTitle>
              <p className="mt-0.5 text-xs text-fg-muted">
                Reconstitution sur treize mois à partir de la situation actuelle.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <NetWorthChart points={patrimony.history} />
            <DisclaimerNote className="mt-3">
              Historique reconstitué pour la démonstration : il ne provient pas de relevés de compte réels.
            </DisclaimerNote>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition du patrimoine</CardTitle>
            <button
              type="button"
              onClick={() => onNavigate('patrimoine')}
              className="text-xs font-medium text-accent-700 hover:underline"
            >
              Détail
            </button>
          </CardHeader>
          <CardContent>
            <AllocationDonut
              slices={patrimony.allocation}
              total={patrimony.grossAssets}
              onSelect={() => onNavigate('patrimoine')}
            />
          </CardContent>
        </Card>
      </div>

      <ScoreBreakdown score={score} />

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-fg">Ce qui mérite votre attention</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Analyse produite par PATRIMONIA INTELLIGENCE à partir de ce dossier.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('risques')}
            className="shrink-0 text-xs font-medium text-accent-700 hover:underline"
          >
            Tout voir
          </button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {insights.slice(0, 4).map((insight) => (
            <InsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
