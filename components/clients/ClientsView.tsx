'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import type { ClientSummary, UserAccount } from '@/types';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  SegmentedControl,
  Select,
  TrendPill,
  type Column,
} from '@/components/ui';
import { CLIENT_STATUS_LABELS, RISK_PROFILE_LABELS } from '@/lib/utils/labels';
import { formatEuro, formatEuroCompact, formatRelative, fullName, initials } from '@/lib/utils/format';
import { createClientAction } from '@/app/(app)/clients/actions';
import { ClientForm } from './ClientForm';
import { ScoreDial } from '@/components/intelligence/ScoreDial';

type SortKey = 'nom' | 'patrimoine' | 'evolution' | 'alertes' | 'score';

export function ClientsView({
  summaries,
  advisors,
  canCreate,
}: {
  summaries: ClientSummary[];
  advisors: UserAccount[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('actif');
  const [risk, setRisk] = useState<string>('tous');
  const [advisor, setAdvisor] = useState<string>('tous');
  const [minWealth, setMinWealth] = useState<string>('0');
  const [sort, setSort] = useState<SortKey>('patrimoine');
  const [createOpen, setCreateOpen] = useState(false);

  const advisorsById = useMemo(
    () => new Map(advisors.map((item) => [item.id, item])),
    [advisors],
  );

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const threshold = Number(minWealth) || 0;

    const filtered = summaries.filter((summary) => {
      const client = summary.client;
      if (needle && !`${client.firstName} ${client.lastName} ${client.email} ${client.city}`.toLowerCase().includes(needle)) {
        return false;
      }
      if (status !== 'tous' && client.status !== status) return false;
      if (risk !== 'tous' && client.riskProfile !== risk) return false;
      if (advisor !== 'tous' && !client.advisors.some((link) => link.advisorId === advisor)) return false;
      if (summary.netWorth < threshold) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'patrimoine':
          return b.netWorth - a.netWorth;
        case 'evolution':
          return b.yearPerformancePct - a.yearPerformancePct;
        case 'alertes':
          return b.openAlerts - a.openAlerts;
        case 'score':
          return a.coherenceScore - b.coherenceScore;
        default:
          return a.client.lastName.localeCompare(b.client.lastName, 'fr');
      }
    });
  }, [summaries, search, status, risk, advisor, minWealth, sort]);

  const columns: Column<ClientSummary>[] = [
    {
      key: 'client',
      header: 'Client',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar label={initials(row.client.firstName, row.client.lastName)} color={row.client.avatarColor} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{fullName(row.client)}</p>
            <p className="truncate text-[11px] text-fg-subtle">
              {row.client.city} · {RISK_PROFILE_LABELS[row.client.riskProfile]}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'netWorth',
      header: 'Patrimoine net',
      align: 'right',
      cell: (row) => <span className="text-sm font-medium text-fg">{formatEuro(row.netWorth)}</span>,
    },
    {
      key: 'evolution',
      header: 'Évolution 12 mois',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <TrendPill value={row.yearPerformancePct} />,
    },
    {
      key: 'score',
      header: 'Cohérence',
      align: 'right',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-sm font-medium text-fg tabular">
          {row.coherenceScore}
          <span className="text-[10px] text-fg-subtle"> /100</span>
        </span>
      ),
    },
    {
      key: 'advisor',
      header: 'Conseiller principal',
      hideOnMobile: true,
      cell: (row) => {
        const primary = row.primaryAdvisorId ? advisorsById.get(row.primaryAdvisorId) : undefined;
        return <span className="text-xs text-fg-muted">{primary ? fullName(primary) : '—'}</span>;
      },
    },
    {
      key: 'lastInteraction',
      header: 'Dernier échange',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-fg-subtle">
          {row.lastInteractionAt ? formatRelative(row.lastInteractionAt) : 'Aucun'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.openAlerts > 0 ? (
            <Badge tone="negative">{row.openAlerts} alerte{row.openAlerts > 1 ? 's' : ''}</Badge>
          ) : null}
          <Badge tone={row.client.status === 'actif' ? 'accent' : row.client.status === 'prospect' ? 'info' : 'neutral'}>
            {CLIENT_STATUS_LABELS[row.client.status]}
          </Badge>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">Clients</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {rows.length} dossier{rows.length > 1 ? 's' : ''} affiché{rows.length > 1 ? 's' : ''} sur {summaries.length}.
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Nouveau client
          </Button>
        ) : null}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="relative sm:col-span-2">
            <span className="sr-only">Rechercher un client</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un nom, un e-mail, une ville…"
              className="pl-9"
            />
          </label>

          <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Statut">
            <option value="tous">Tous les statuts</option>
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select value={risk} onChange={(event) => setRisk(event.target.value)} aria-label="Profil de risque">
            <option value="tous">Tous les profils</option>
            {Object.entries(RISK_PROFILE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select value={advisor} onChange={(event) => setAdvisor(event.target.value)} aria-label="Conseiller">
            <option value="tous">Tous les conseillers</option>
            {advisors.map((item) => (
              <option key={item.id} value={item.id}>
                {fullName(item)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Select
            value={minWealth}
            onChange={(event) => setMinWealth(event.target.value)}
            aria-label="Patrimoine minimum"
            className="w-auto"
          >
            <option value="0">Patrimoine : tous</option>
            <option value="250000">à partir de 250 k€</option>
            <option value="500000">à partir de 500 k€</option>
            <option value="1000000">à partir de 1 M€</option>
          </Select>

          <SegmentedControl
            options={[
              { value: 'patrimoine', label: 'Patrimoine' },
              { value: 'evolution', label: 'Évolution' },
              { value: 'alertes', label: 'Alertes' },
              { value: 'score', label: 'Cohérence' },
              { value: 'nom', label: 'Nom' },
            ]}
            value={sort}
            onChange={(value) => setSort(value as SortKey)}
            className="ml-auto"
          />
        </div>
      </Card>

      <Card className="p-2 sm:p-4">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.client.id}
          onRowClick={(row) => router.push(`/clients/${row.client.id}`)}
          emptyTitle="Aucun client ne correspond"
          emptyDescription="Ajustez la recherche ou les filtres pour élargir les résultats."
          mobileCard={(row) => (
            <Link
              href={`/clients/${row.client.id}`}
              className="block rounded-xl border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-3">
                <Avatar label={initials(row.client.firstName, row.client.lastName)} color={row.client.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{fullName(row.client)}</p>
                  <p className="truncate text-[11px] text-fg-subtle">
                    {RISK_PROFILE_LABELS[row.client.riskProfile]} · {row.client.city}
                  </p>
                </div>
                <ScoreDial score={row.coherenceScore} size={40} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-fg-subtle">Patrimoine net</p>
                  <p className="text-sm font-semibold text-fg tabular">{formatEuroCompact(row.netWorth)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {row.openAlerts > 0 ? <Badge tone="negative">{row.openAlerts}</Badge> : null}
                  <TrendPill value={row.yearPerformancePct} />
                </div>
              </div>
            </Link>
          )}
        />
      </Card>

      {canCreate ? (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Nouveau client"
          description="Les données saisies ici alimentent immédiatement l’analyse patrimoniale."
          size="lg"
        >
          <ClientForm
            advisors={advisors}
            action={createClientAction}
            submitLabel="Créer le client"
            onDone={() => {
              setCreateOpen(false);
              router.refresh();
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
