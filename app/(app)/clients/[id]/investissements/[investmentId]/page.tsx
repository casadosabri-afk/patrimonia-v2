import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Eye, Lightbulb, Scale } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getClientOverview } from '@/services/portfolio';
import { getMarketDataService } from '@/services/market';
import { analyzeInvestment } from '@/lib/intelligence/investment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendPill } from '@/components/ui/TrendPill';
import { OriginBadge, DisclaimerNote } from '@/components/ui/DataNotice';
import { PriceChart } from '@/components/charts/PriceChart';
import { ACCOUNT_KIND_LABELS, INSTRUMENT_TYPE_LABELS } from '@/lib/utils/labels';
import { formatDate, formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; investmentId: string }>;
}): Promise<Metadata> {
  const { id, investmentId } = await params;
  const { access } = await requireAccess('advisor', 'admin');
  const overview = await getClientOverview(access, id);
  const investment = overview?.investments.find((item) => item.id === investmentId);
  return { title: investment?.name ?? 'Investissement' };
}

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ id: string; investmentId: string }>;
}) {
  const { id, investmentId } = await params;
  const { access } = await requireAccess('advisor', 'admin');

  const overview = await getClientOverview(access, id);
  if (!overview) notFound();

  const investment = overview.investments.find((item) => item.id === investmentId);
  if (!investment) notFound();

  const account = overview.record.accounts.find((item) => item.id === investment.accountId);
  const market = getMarketDataService();

  const [profile, financials] = investment.ticker
    ? await Promise.all([
        market.getCompanyProfile(investment.ticker),
        market.getFinancials(investment.ticker),
      ])
    : [null, null];

  const financialTotal = overview.investments.reduce((sum, item) => sum + item.value, 0);
  const sameSectorValue = overview.investments
    .filter((item) => item.sector === investment.sector)
    .reduce((sum, item) => sum + item.value, 0);

  const analysis = analyzeInvestment(investment, {
    grossAssets: overview.patrimony.grossAssets,
    financialTotal,
    sameSectorValue,
    financials: financials?.data ?? null,
  });

  const blocks = [
    { key: 'opportunites', title: 'Opportunités', icon: Lightbulb, tone: 'positive' as const, items: analysis.opportunities },
    { key: 'risques', title: 'Risques', icon: AlertTriangle, tone: 'negative' as const, items: analysis.risks },
    { key: 'vigilance', title: 'Points de vigilance', icon: Eye, tone: 'warning' as const, items: analysis.watchPoints },
  ];

  return (
    <div className="space-y-5">
      <Link
        href={`/clients/${id}?section=investissements`}
        className="flex items-center gap-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Retour au portefeuille
      </Link>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{investment.name}</h1>
              <Badge tone="brand">{INSTRUMENT_TYPE_LABELS[investment.type]}</Badge>
              {investment.ticker ? <Badge tone="neutral">{investment.ticker}</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              {investment.sector} · {investment.region}
              {account ? ` · ${account.label} (${ACCOUNT_KIND_LABELS[account.kind]})` : ''}
            </p>
            {investment.isin ? (
              <p className="mt-0.5 text-[11px] text-fg-subtle">ISIN {investment.isin}</p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tracking-tight text-fg tabular">{formatEuro(investment.value)}</p>
            <div className="mt-1 flex justify-end">
              <TrendPill value={investment.gainPct} />
            </div>
            <div className="mt-2 flex justify-end">
              <OriginBadge origin={investment.priceOrigin} provider={investment.priceProvider} />
            </div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 text-xs sm:grid-cols-4">
          {[
            { label: 'Quantité', value: formatNumber(investment.quantity, 4) },
            { label: 'Prix de revient', value: formatEuro(investment.averageCost, true) },
            { label: 'Cours actuel', value: formatEuro(investment.price, true) },
            { label: 'Montant investi', value: formatEuro(investment.investedAmount) },
            { label: 'Plus ou moins-value', value: formatEuro(investment.gain) },
            { label: 'Performance', value: formatPercent(investment.gainPct, 2) },
            { label: 'Poids dans le portefeuille', value: formatPercent(investment.weightPct, 2) },
            { label: 'Acquis le', value: formatDate(investment.purchasedAt, 'long') },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-fg-subtle">{item.label}</dt>
              <dd className="mt-0.5 font-medium text-fg tabular">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {investment.ticker ? (
        <Card>
          <CardHeader>
            <CardTitle>Évolution du cours</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart symbol={investment.ticker} currency={investment.currency} />
          </CardContent>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="text-xs text-fg-muted">
            Cet actif n’est pas coté : aucune série de cours n’existe. La valeur affichée est une estimation
            renseignée dans le dossier, non une donnée de marché.
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <Card key={block.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    className={
                      block.tone === 'positive'
                        ? 'size-4 text-positive'
                        : block.tone === 'negative'
                          ? 'size-4 text-negative'
                          : 'size-4 text-warning'
                    }
                    aria-hidden
                  />
                  {block.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {block.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current opacity-50" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-4 text-brand-500" aria-hidden />
              Impact sur le portefeuille
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-relaxed text-fg-muted">{analysis.portfolioImpact}</p>
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">{analysis.explanation}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Données de l’émetteur</CardTitle>
            {financials ? <OriginBadge origin={financials.origin} provider={financials.provider} /> : null}
          </CardHeader>
          <CardContent>
            {profile?.data ? (
              <>
                <p className="text-xs leading-relaxed text-fg-muted">
                  {profile.data.description
                    ? profile.data.description.slice(0, 420) +
                      (profile.data.description.length > 420 ? '…' : '')
                    : 'Aucune description fournie par le fournisseur de données.'}
                </p>
                {profile.data.website ? (
                  <a
                    href={profile.data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[11px] font-medium text-accent-700 hover:underline"
                  >
                    Site de l’émetteur
                  </a>
                ) : null}
              </>
            ) : (
              <p className="text-xs text-fg-muted">
                Aucune fiche émetteur disponible pour ce support auprès du fournisseur configuré.
              </p>
            )}

            {financials?.data ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs">
                {[
                  { label: 'PER', value: financials.data.peRatio, format: (value: number) => formatNumber(value, 1) },
                  {
                    label: 'Rendement du dividende',
                    value: financials.data.dividendYieldPct,
                    format: (value: number) => formatPercent(value, 2),
                  },
                  { label: 'Bêta', value: financials.data.beta, format: (value: number) => formatNumber(value, 2) },
                  {
                    label: 'Marge nette',
                    value: financials.data.profitMarginPct,
                    format: (value: number) => formatPercent(value, 1),
                  },
                  {
                    label: 'Plus haut 52 semaines',
                    value: financials.data.fiftyTwoWeekHigh,
                    format: (value: number) => formatNumber(value, 2),
                  },
                  {
                    label: 'Plus bas 52 semaines',
                    value: financials.data.fiftyTwoWeekLow,
                    format: (value: number) => formatNumber(value, 2),
                  },
                ]
                  .filter((row) => typeof row.value === 'number')
                  .map((row) => (
                    <div key={row.label} className="flex justify-between gap-2">
                      <dt className="text-fg-subtle">{row.label}</dt>
                      <dd className="font-medium text-fg tabular">{row.format(row.value as number)}</dd>
                    </div>
                  ))}
              </dl>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <DisclaimerNote>
        L’analyse présentée ci-dessus est construite à partir des caractéristiques observables de la ligne et de
        son poids dans le portefeuille. Elle a une visée pédagogique et ne constitue ni une recommandation
        d’achat ou de vente, ni un conseil en investissement.
      </DisclaimerNote>
    </div>
  );
}
