import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Building2, ShieldCheck, TrendingUp, UserCog, Users } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getClientSummaries } from '@/services/portfolio';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { isSupabaseConfigured } from '@/lib/env';
import { formatEuroCompact, formatPercent, formatRelative, fullName } from '@/lib/utils/format';
import { ROLE_LABELS } from '@/lib/utils/labels';

export const metadata: Metadata = { title: 'Cabinet' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { access } = await requireAccess('admin');
  const repository = getRepository();

  const [firm, users, clients, alerts, audit] = await Promise.all([
    repository.getFirm(access),
    repository.listUsers(access),
    repository.listClients(access),
    repository.listAlerts(access, { status: 'tous' }),
    repository.listAudit(access, 12),
  ]);

  const advisors = users.filter((user) => user.role === 'advisor');
  const activeClients = clients.filter((client) => client.status !== 'archive');
  const summaries = await getClientSummaries(access, activeClients);

  const totalAssets = summaries.reduce((sum, summary) => sum + summary.netWorth, 0);
  const averagePerformance =
    summaries.length > 0
      ? summaries.reduce((sum, summary) => sum + summary.yearPerformancePct, 0) / summaries.length
      : 0;
  const averageScore =
    summaries.length > 0
      ? Math.round(summaries.reduce((sum, summary) => sum + summary.coherenceScore, 0) / summaries.length)
      : 0;
  const openAlerts = alerts.filter((alert) => alert.status === 'ouverte' || alert.status === 'en_cours');

  const perAdvisor = advisors.map((advisor) => {
    const portfolio = summaries.filter((summary) =>
      summary.client.advisors.some((link) => link.advisorId === advisor.id),
    );
    return {
      advisor,
      clientCount: portfolio.length,
      assets: portfolio.reduce((sum, summary) => sum + summary.netWorth, 0),
      alerts: portfolio.reduce((sum, summary) => sum + summary.openAlerts, 0),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={firm?.branding.firmName ?? 'Cabinet'}
        subtitle="Pilotage du cabinet : équipe, encours suivis, activité et paramètres."
        actions={
          <Badge tone={isSupabaseConfigured() ? 'positive' : 'info'} dot>
            {isSupabaseConfigured() ? 'Base Supabase connectée' : 'Mode démonstration'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Conseillers" value={`${advisors.length}`} sublabel={`${advisors.filter((a) => a.active).length} actif(s)`} icon={UserCog} />
        <MetricCard label="Clients suivis" value={`${activeClients.length}`} sublabel={`${clients.length - activeClients.length} archivé(s)`} icon={Users} />
        <MetricCard
          label="Patrimoine suivi"
          value={formatEuroCompact(totalAssets)}
          changePct={averagePerformance}
          sublabel="performance moyenne"
          icon={TrendingUp}
          tone="accent"
        />
        <MetricCard label="Alertes ouvertes" value={`${openAlerts.length}`} sublabel={`score moyen ${averageScore}/100`} icon={AlertTriangle} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité par conseiller</CardTitle>
            <Link href="/admin/utilisateurs" className="text-xs font-medium text-accent-700 hover:underline">
              Gérer
            </Link>
          </CardHeader>
          <CardContent>
            {perAdvisor.length === 0 ? (
              <EmptyState icon={Building2} title="Aucun conseiller" />
            ) : (
              <ul className="divide-y divide-border">
                {perAdvisor.map((row) => (
                  <li key={row.advisor.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.advisor.avatarColor }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">{fullName(row.advisor)}</p>
                      <p className="truncate text-[11px] text-fg-subtle">
                        {row.clientCount} client(s) · {row.alerts} alerte(s)
                      </p>
                    </div>
                    {!row.advisor.active ? <Badge tone="neutral">Désactivé</Badge> : null}
                    <p className="shrink-0 text-xs font-medium text-fg tabular">
                      {formatEuroCompact(row.assets)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <Link href="/admin/audit" className="text-xs font-medium text-accent-700 hover:underline">
              Journal complet
            </Link>
          </CardHeader>
          <CardContent>
            {audit.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Aucune action enregistrée"
                description="Les actions effectuées dans l’application apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-border">
                {audit.map((entry) => (
                  <li key={entry.id} className="py-2">
                    <p className="text-xs text-fg">
                      <span className="font-medium">{entry.userLabel}</span>{' '}
                      <span className="text-fg-muted">{entry.action}</span>{' '}
                      {entry.targetLabel ? <span className="text-fg-muted">— {entry.targetLabel}</span> : null}
                    </p>
                    <p className="text-[11px] text-fg-subtle">{formatRelative(entry.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-3">
            {(['admin', 'advisor', 'client'] as const).map((role) => (
              <li key={role} className="rounded-xl bg-surface-2 p-3">
                <p className="text-[11px] text-fg-muted">{ROLE_LABELS[role]}</p>
                <p className="mt-1 text-lg font-semibold text-fg tabular">
                  {users.filter((user) => user.role === role).length}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-fg-subtle">
            Performance moyenne indicative du cabinet sur douze mois : {formatPercent(averagePerformance, 1)}.
          </p>
        </CardContent>
      </Card>

      <DisclaimerNote>
        Les encours affichés reposent sur des données clients fictives. Les valorisations des lignes cotées
        proviennent du fournisseur de marché configuré, ou d’un jeu simulé signalé comme tel.
      </DisclaimerNote>
    </div>
  );
}
