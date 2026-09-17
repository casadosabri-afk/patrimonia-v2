'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArrowLeft, FileDown, Pencil, QrCode, RotateCcw } from 'lucide-react';
import type {
  Alert,
  Appointment,
  AssetAccount,
  Client,
  CoherenceScore,
  GoalProjection,
  Insight,
  Interaction,
  Message,
  Patrimony,
  StoredDocument,
  UserAccount,
  ValuedInvestment,
} from '@/types';
import type { DebtMetrics, PropertyMetrics } from '@/lib/patrimony/debt';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Modal,
  Tabs,
  TrendPill,
  OriginBadge,
  type TabItem,
} from '@/components/ui';
import { ScoreDial } from '@/components/intelligence/ScoreDial';
import {
  CLIENT_STATUS_LABELS,
  MARITAL_STATUS_LABELS,
  MATRIMONIAL_REGIME_LABELS,
  RISK_PROFILE_LABELS,
} from '@/lib/utils/labels';
import { ageFromBirthDate, formatDate, formatEuro, fullName, initials } from '@/lib/utils/format';
import { setClientStatusAction, updateClientAction } from '@/app/(app)/clients/actions';
import { ClientForm } from './ClientForm';
import { ClientQrDialog } from './ClientQrDialog';
import { OverviewSection } from './sections/OverviewSection';
import { PatrimonySection } from './sections/PatrimonySection';
import { InvestmentsSection } from './sections/InvestmentsSection';
import { RealEstateSection } from './sections/RealEstateSection';
import { DebtsSection } from './sections/DebtsSection';
import { GoalsSection } from './sections/GoalsSection';
import { InsightsSection } from './sections/InsightsSection';
import { CrmSection } from './sections/CrmSection';
import { AppointmentsSection } from './sections/AppointmentsSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { MessagesSection } from './sections/MessagesSection';

export interface ClientDetailProps {
  initialSection: string;
  client: Client;
  accounts: AssetAccount[];
  patrimony: Patrimony;
  investments: ValuedInvestment[];
  propertyMetrics: PropertyMetrics[];
  debtMetrics: DebtMetrics[];
  debtRatio: number;
  goals: GoalProjection[];
  insights: Insight[];
  score: CoherenceScore;
  priceOrigin: 'live' | 'mock' | 'fixture';
  priceProvider: string;
  alerts: Alert[];
  interactions: Interaction[];
  appointments: Appointment[];
  documents: StoredDocument[];
  conversationId: string | null;
  messages: Message[];
  primaryAdvisor: UserAccount | null;
  associateAdvisors: UserAccount[];
  advisors: UserAccount[];
}

export function ClientDetail(props: ClientDetailProps) {
  const router = useRouter();
  const [section, setSection] = useState(props.initialSection);
  const [editOpen, setEditOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { client, patrimony, insights } = props;
  const archived = client.status === 'archive';

  const updateAction = useMemo(() => updateClientAction.bind(null, client.id), [client.id]);

  const tabs: TabItem[] = [
    { value: 'apercu', label: 'Vue d’ensemble' },
    { value: 'patrimoine', label: 'Patrimoine' },
    { value: 'investissements', label: 'Investissements', count: props.investments.length },
    { value: 'immobilier', label: 'Immobilier', count: props.propertyMetrics.length },
    { value: 'dettes', label: 'Dettes', count: props.debtMetrics.length },
    { value: 'objectifs', label: 'Objectifs', count: props.goals.length },
    { value: 'risques', label: 'Analyse', count: insights.length },
    { value: 'documents', label: 'Documents', count: props.documents.length },
    { value: 'crm', label: 'CRM', count: props.interactions.length },
    { value: 'rendez-vous', label: 'Rendez-vous', count: props.appointments.length },
    { value: 'messages', label: 'Messages', count: props.messages.length },
  ];

  const navigate = useCallback((next: string) => setSection(next), []);

  const toggleArchive = () =>
    startTransition(() => {
      void setClientStatusAction(client.id, archived ? 'actif' : 'archive');
    });

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push('/clients')}
        className="flex items-center gap-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Tous les clients
      </button>

      {/* En-tête du dossier */}
      <Card className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Avatar
              label={initials(client.firstName, client.lastName)}
              color={client.avatarColor}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                  {fullName(client)}
                </h1>
                <Badge tone={client.status === 'actif' ? 'accent' : client.status === 'prospect' ? 'info' : 'neutral'}>
                  {CLIENT_STATUS_LABELS[client.status]}
                </Badge>
                <Badge tone="brand">Profil {RISK_PROFILE_LABELS[client.riskProfile].toLowerCase()}</Badge>
              </div>

              <p className="mt-1 text-sm text-fg-muted">
                {ageFromBirthDate(client.birthDate)} ans · {client.profession} · {client.city}
              </p>

              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-fg-subtle">Conseiller principal</dt>
                  <dd className="font-medium text-fg">
                    {props.primaryAdvisor ? fullName(props.primaryAdvisor) : 'Non attribué'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-fg-subtle">Conseillers associés</dt>
                  <dd className="text-fg-muted">
                    {props.associateAdvisors.length > 0
                      ? props.associateAdvisors.map((advisor) => fullName(advisor)).join(', ')
                      : 'Aucun'}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-fg-subtle">Situation</dt>
                  <dd className="text-fg-muted">
                    {MARITAL_STATUS_LABELS[client.maritalStatus]} ·{' '}
                    {MATRIMONIAL_REGIME_LABELS[client.matrimonialRegime]} · {client.dependents} personne(s) à charge
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-fg-subtle">Profil actualisé le</dt>
                  <dd className="text-fg-muted">{formatDate(client.profileUpdatedAt, 'long')}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 lg:flex-col lg:items-end">
            <div className="text-right">
              <p className="text-[11px] text-fg-subtle">Patrimoine net</p>
              <p className="text-2xl font-semibold tracking-tight text-fg tabular">
                {formatEuro(patrimony.netWorth)}
              </p>
              <div className="mt-1 flex justify-end">
                <TrendPill value={patrimony.yearPerformancePct} suffix="sur 12 mois" />
              </div>
            </div>
            <ScoreDial score={props.score.score} size={72} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" aria-hidden />
            Modifier
          </Button>
          <a
            href={`/api/rapport/${client.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-2"
          >
            <FileDown className="size-3.5" aria-hidden />
            Rapport patrimonial
          </a>
          <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
            <QrCode className="size-3.5" aria-hidden />
            Accès QR
          </Button>
          <Button size="sm" variant="ghost" onClick={toggleArchive} loading={isPending} className="ml-auto">
            {archived ? <RotateCcw className="size-3.5" aria-hidden /> : <Archive className="size-3.5" aria-hidden />}
            {archived ? 'Réactiver le dossier' : 'Archiver'}
          </Button>
          <OriginBadge origin={props.priceOrigin} provider={props.priceProvider} />
        </div>
      </Card>

      <Tabs items={tabs} value={section} onChange={setSection} className="rounded-xl bg-surface-2 p-1" />

      <div>
        {section === 'apercu' ? (
          <OverviewSection
            client={client}
            patrimony={patrimony}
            score={props.score}
            insights={insights}
            onNavigate={navigate}
          />
        ) : null}

        {section === 'patrimoine' ? (
          <PatrimonySection
            patrimony={patrimony}
            accounts={props.accounts}
            investments={props.investments}
          />
        ) : null}

        {section === 'investissements' ? (
          <InvestmentsSection
            clientId={client.id}
            investments={props.investments}
            accounts={props.accounts}
            priceOrigin={props.priceOrigin}
            priceProvider={props.priceProvider}
          />
        ) : null}

        {section === 'immobilier' ? <RealEstateSection metrics={props.propertyMetrics} /> : null}

        {section === 'dettes' ? (
          <DebtsSection
            metrics={props.debtMetrics}
            debtRatio={props.debtRatio}
            annualIncome={client.annualIncome}
          />
        ) : null}

        {section === 'objectifs' ? <GoalsSection clientId={client.id} goals={props.goals} /> : null}

        {section === 'risques' ? <InsightsSection insights={insights} /> : null}

        {section === 'documents' ? (
          <DocumentsSection clientId={client.id} documents={props.documents} />
        ) : null}

        {section === 'crm' ? (
          <CrmSection clientId={client.id} interactions={props.interactions} />
        ) : null}

        {section === 'rendez-vous' ? (
          <AppointmentsSection clientId={client.id} appointments={props.appointments} />
        ) : null}

        {section === 'messages' ? (
          <MessagesSection
            conversationId={props.conversationId}
            messages={props.messages}
            viewerRole="advisor"
            advisorName={props.primaryAdvisor ? fullName(props.primaryAdvisor) : 'Conseiller'}
            clientName={fullName(client)}
          />
        ) : null}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier le client"
        size="lg"
      >
        <ClientForm
          advisors={props.advisors}
          client={client}
          action={updateAction}
          submitLabel="Enregistrer"
          onDone={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Modal>

      <ClientQrDialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        clientId={client.id}
        clientName={fullName(client)}
      />
    </div>
  );
}
