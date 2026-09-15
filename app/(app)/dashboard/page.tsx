import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarCheck, Users, Wallet } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getClientSummaries, getPortfolioInsights } from '@/services/portfolio';
import { getMarketDataService } from '@/services/market';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { Badge } from '@/components/ui/Badge';
import { InsightCard } from '@/components/intelligence/InsightCard';
import { MarketStrip } from '@/components/dashboard/MarketStrip';
import { NewsFeed } from '@/components/dashboard/NewsFeed';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { formatEuroCompact, formatDate } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Tableau de bord' };
export const dynamic = 'force-dynamic';

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default async function DashboardPage() {
  const { user, access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();
  const now = new Date();

  const [clients, alerts, appointments] = await Promise.all([
    repository.listClients(access),
    repository.listAlerts(access, { status: 'tous' }),
    repository.listAppointments(access),
  ]);

  // Un conseiller pilote son portefeuille ; un administrateur voit tout le cabinet.
  const myClients =
    user.role === 'admin'
      ? clients
      : clients.filter((client) => client.advisors.some((link) => link.advisorId === user.id));

  const activeClients = myClients.filter((client) => client.status !== 'archive');
  const clientIds = new Set(myClients.map((client) => client.id));

  const [summaries, insights, indices, news] = await Promise.all([
    getClientSummaries(access, activeClients, now),
    getPortfolioInsights(access, activeClients, now),
    getMarketDataService().getIndexData(),
    getMarketDataService().getNews(undefined, 6),
  ]);

  const assetsUnderManagement = summaries.reduce((sum, summary) => sum + summary.netWorth, 0);
  const averagePerformance =
    summaries.length > 0
      ? summaries.reduce((sum, summary) => sum + summary.yearPerformancePct, 0) / summaries.length
      : 0;

  const openAlerts = alerts.filter(
    (alert) =>
      (alert.status === 'ouverte' || alert.status === 'en_cours') &&
      (!alert.clientId || clientIds.has(alert.clientId)),
  );

  const upcoming = appointments.filter(
    (appointment) =>
      new Date(appointment.startsAt) >= now &&
      appointment.status !== 'annule' &&
      clientIds.has(appointment.clientId),
  );

  const todayAppointments = upcoming.filter(
    (appointment) => new Date(appointment.startsAt).toDateString() === now.toDateString(),
  );

  const clientsById = new Map(myClients.map((client) => [client.id, client]));

  const toHandle = insights.slice(0, 5);
  const opportunities = insights.filter((item) => item.insight.kind === 'opportunite').slice(0, 3);
  const risks = insights
    .filter((item) => item.insight.kind === 'risque' && item.insight.severity !== 'faible')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-fg-subtle">{formatDate(now, 'long')}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {greeting(now)} {user.firstName}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {toHandle.length > 0
            ? `${toHandle.length} point${toHandle.length > 1 ? 's' : ''} méritent votre attention aujourd’hui.`
            : 'Aucun point d’attention détecté sur votre portefeuille.'}
        </p>
      </header>

      {/* Indicateurs d'activité */}
      <section aria-label="Votre activité aujourd’hui">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Clients suivis"
            value={`${activeClients.length}`}
            sublabel={`${myClients.length - activeClients.length} archivé(s)`}
            icon={Users}
          />
          <MetricCard
            label="Patrimoine sous gestion"
            value={formatEuroCompact(assetsUnderManagement)}
            changePct={averagePerformance}
            sublabel="sur douze mois"
            icon={Wallet}
            tone="accent"
          />
          <MetricCard
            label="Alertes ouvertes"
            value={`${openAlerts.length}`}
            sublabel={`${openAlerts.filter((alert) => alert.severity === 'critique' || alert.severity === 'eleve').length} prioritaire(s)`}
            icon={AlertTriangle}
          />
          <MetricCard
            label="Rendez-vous"
            value={`${todayAppointments.length}`}
            sublabel={`${upcoming.length} à venir`}
            icon={CalendarCheck}
          />
        </div>
      </section>

      {/* À traiter aujourd'hui */}
      <section aria-label="À traiter aujourd’hui">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-fg">À traiter aujourd’hui</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Priorisé par PATRIMONIA INTELLIGENCE à partir des données de vos clients.
            </p>
          </div>
          <Link
            href="/alertes"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent-700 hover:underline"
          >
            Toutes les alertes
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>

        {toHandle.length === 0 ? (
          <Card>
            <EmptyState
              title="Rien à traiter pour le moment"
              description="Aucun risque ni opportunité n’a été détecté sur les dossiers que vous suivez."
            />
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {toHandle.map(({ client, insight }) => (
              <InsightCard key={insight.id} insight={insight} client={client} compact />
            ))}
          </div>
        )}
      </section>

      {/* Opportunités et risques */}
      <section className="grid gap-4 lg:grid-cols-2" aria-label="Opportunités et risques">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-fg">Opportunités</h2>
            <Badge tone="positive">{opportunities.length}</Badge>
          </div>
          {opportunities.length === 0 ? (
            <Card>
              <EmptyState title="Aucune opportunité détectée" />
            </Card>
          ) : (
            <div className="space-y-3">
              {opportunities.map(({ client, insight }) => (
                <InsightCard key={insight.id} insight={insight} client={client} compact />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-fg">Risques</h2>
            <Badge tone="negative">{risks.length}</Badge>
          </div>
          {risks.length === 0 ? (
            <Card>
              <EmptyState title="Aucun risque significatif détecté" />
            </Card>
          ) : (
            <div className="space-y-3">
              {risks.map(({ client, insight }) => (
                <InsightCard key={insight.id} insight={insight} client={client} compact />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Marchés, actualités, agenda */}
      <section className="grid gap-4 lg:grid-cols-3" aria-label="Marchés et agenda">
        <MarketStrip indices={indices.data} origin={indices.origin} provider={indices.provider} />
        <NewsFeed items={news.data} origin={news.origin} provider={news.provider} />
        <UpcomingAppointments appointments={upcoming} clientsById={clientsById} />
      </section>

      {/* Clients les plus exposés */}
      <section aria-label="Clients à surveiller">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-fg">Cohérence des dossiers</h2>
          <Link href="/clients" className="text-xs font-medium text-accent-700 hover:underline">
            Tous les clients
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Scores les plus faibles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {[...summaries]
                .sort((a, b) => a.coherenceScore - b.coherenceScore)
                .slice(0, 5)
                .map((summary) => (
                  <li key={summary.client.id}>
                    <Link
                      href={`/clients/${summary.client.id}`}
                      className="flex items-center gap-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: summary.client.avatarColor }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
                        {summary.client.firstName} {summary.client.lastName}
                      </span>
                      <span className="hidden text-xs text-fg-subtle tabular sm:block">
                        {formatEuroCompact(summary.netWorth)}
                      </span>
                      <span className="w-24 text-right">
                        <span className="text-xs font-semibold text-fg tabular">
                          {summary.coherenceScore}
                        </span>
                        <span className="text-[10px] text-fg-subtle"> / 100</span>
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <DisclaimerNote>
        PATRIMONIA INTELLIGENCE produit des aides à l’analyse à visée pédagogique, à partir des données
        renseignées dans le dossier. Ces éléments ne constituent pas un conseil en investissement au sens
        réglementaire et n’engagent ni le cabinet, ni l’éditeur.
      </DisclaimerNote>
    </div>
  );
}
