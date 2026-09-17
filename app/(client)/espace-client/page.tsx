import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, MessageSquare, Target, TrendingUp, Wallet } from 'lucide-react';
import { requireClientOverview } from '@/lib/auth/clientAccess';
import { getRepository } from '@/services/db';
import { projectGoal } from '@/lib/patrimony/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendPill } from '@/components/ui/TrendPill';
import { Progress } from '@/components/ui/Progress';
import { DisclaimerNote } from '@/components/ui/DataNotice';
import { AllocationDonut } from '@/components/charts/AllocationDonut';
import { NetWorthChart } from '@/components/charts/NetWorthChart';
import { formatDate, formatEuro, formatPercent, fullName } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mon espace' };
export const dynamic = 'force-dynamic';

export default async function ClientHomePage() {
  const { user, access, overview } = await requireClientOverview();
  const repository = getRepository();

  const [users, appointments, documents] = await Promise.all([
    repository.listUsers(access).catch(() => []),
    repository.listAppointments(access, overview.record.client.id),
    repository.listDocuments(access, overview.record.client.id),
  ]);

  const primaryLink = overview.record.client.advisors.find((link) => link.primary);
  const advisor = users.find((item) => item.id === primaryLink?.advisorId) ?? null;
  const nextAppointment = appointments.find((item) => new Date(item.startsAt) >= new Date());
  const goals = overview.record.goals.map((goal) => projectGoal(goal)).slice(0, 3);

  const shortcuts = [
    { href: '/espace-client/patrimoine', label: 'Votre patrimoine', icon: Wallet },
    { href: '/espace-client/investissements', label: 'Vos investissements', icon: TrendingUp },
    { href: '/espace-client/objectifs', label: 'Vos objectifs', icon: Target },
    { href: '/espace-client/documents', label: 'Vos documents', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-fg-subtle">{formatDate(new Date(), 'long')}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Bonjour {user.firstName}
        </h1>
      </header>

      <Card className="pat-grid-bg overflow-hidden p-6">
        <p className="text-sm text-fg-muted">Votre patrimoine</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-fg tabular sm:text-5xl">
          {formatEuro(overview.patrimony.netWorth)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TrendPill value={overview.patrimony.yearPerformancePct} />
          <span className="text-xs text-fg-muted">sur les douze derniers mois</span>
        </div>

        <div className="mt-6">
          <NetWorthChart points={overview.patrimony.history} height={180} showDebt={false} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;
          return (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="group rounded-card border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium text-fg">{shortcut.label}</p>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-fg-subtle group-hover:text-accent-700">
                Consulter
                <ArrowRight className="size-3" aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comment votre patrimoine est réparti</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonut slices={overview.patrimony.allocation} total={overview.patrimony.grossAssets} />
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">
              Répartir son patrimoine entre plusieurs catégories permet de ne pas dépendre de l’évolution d’un
              seul marché. Votre conseiller ajuste cette répartition avec vous au fil du temps.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {goals.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Vos objectifs</CardTitle>
                <Link href="/espace-client/objectifs" className="text-xs font-medium text-accent-700 hover:underline">
                  Détail
                </Link>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {goals.map((projection) => (
                    <li key={projection.goal.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-xs font-medium text-fg">{projection.goal.label}</p>
                        <p className="shrink-0 text-xs text-fg-subtle tabular">
                          {formatPercent(projection.progressPct, 0)}
                        </p>
                      </div>
                      <Progress
                        value={projection.progressPct}
                        tone={projection.onTrack ? 'positive' : 'accent'}
                        className="mt-1.5 h-1.5"
                        label={projection.goal.label}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Votre conseiller</CardTitle>
            </CardHeader>
            <CardContent>
              {advisor ? (
                <>
                  <p className="text-sm font-medium text-fg">{fullName(advisor)}</p>
                  <p className="text-xs text-fg-muted">{advisor.jobTitle ?? 'Conseiller en gestion de patrimoine'}</p>
                  {nextAppointment ? (
                    <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-fg-muted">
                      Prochain rendez-vous : {formatDate(nextAppointment.startsAt, 'long')} —{' '}
                      {nextAppointment.title}
                    </p>
                  ) : null}
                  <Link
                    href="/espace-client/conseiller"
                    className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent-500 px-3 text-xs font-medium text-white"
                  >
                    <MessageSquare className="size-3.5" aria-hidden />
                    Écrire à mon conseiller
                  </Link>
                </>
              ) : (
                <p className="text-xs text-fg-muted">Aucun conseiller n’est actuellement rattaché à votre dossier.</p>
              )}

              <p className="mt-3 text-[11px] text-fg-subtle">
                {documents.length} document{documents.length > 1 ? 's' : ''} sont à votre disposition dans votre
                espace.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DisclaimerNote>
        Les informations présentées dans cet espace sont fournies à titre de suivi. Elles ne constituent pas un
        conseil en investissement. Pour toute décision, échangez avec votre conseiller.
      </DisclaimerNote>
    </div>
  );
}
