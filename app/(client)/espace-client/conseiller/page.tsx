import type { Metadata } from 'next';
import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessagesSection } from '@/components/clients/sections/MessagesSection';
import { APPOINTMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatDateTime, fullName, initials } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mon conseiller' };
export const dynamic = 'force-dynamic';

export default async function ClientAdvisorPage() {
  const { user, access } = await requireAccess('client');
  const repository = getRepository();

  const [firm, conversations, appointments, clients] = await Promise.all([
    repository.getFirm(access),
    repository.listConversations(access),
    repository.listAppointments(access),
    repository.listClients(access),
  ]);

  const client = clients[0] ?? null;
  const conversation = conversations[0] ?? null;
  const messages = conversation ? await repository.listMessages(access, conversation.id) : [];

  // Le profil du conseiller est lu côté serveur : le client n'a pas accès à la
  // liste des utilisateurs du cabinet.
  const advisorId = client?.advisors.find((link) => link.primary)?.advisorId ?? null;
  const advisor = advisorId ? await repository.getUser(access, advisorId) : null;

  const upcoming = appointments.filter((item) => new Date(item.startsAt) >= new Date()).slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader title="Votre conseiller" subtitle="Échangez directement et retrouvez vos prochains rendez-vous." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            {advisor ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar
                    label={initials(advisor.firstName, advisor.lastName)}
                    color={advisor.avatarColor}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{fullName(advisor)}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {advisor.jobTitle ?? 'Conseiller en gestion de patrimoine'}
                    </p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs">
                  <li className="flex items-center gap-2 text-fg-muted">
                    <Mail className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                    <a href={`mailto:${advisor.email}`} className="truncate hover:text-fg">
                      {advisor.email}
                    </a>
                  </li>
                  {advisor.phone ? (
                    <li className="flex items-center gap-2 text-fg-muted">
                      <Phone className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                      <a href={`tel:${advisor.phone.replace(/\s/g, '')}`} className="hover:text-fg">
                        {advisor.phone}
                      </a>
                    </li>
                  ) : null}
                  {firm ? (
                    <li className="flex items-start gap-2 text-fg-muted">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden />
                      <span>
                        {firm.branding.firmName}
                        <br />
                        {firm.branding.contactPhone}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : (
              <EmptyState title="Aucun conseiller rattaché" />
            )}

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                <CalendarDays className="size-3.5" aria-hidden />
                Prochains rendez-vous
              </p>
              {upcoming.length === 0 ? (
                <p className="text-[11px] text-fg-subtle">Aucun rendez-vous planifié pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map((appointment) => (
                    <li key={appointment.id} className="rounded-xl bg-surface-2 px-3 py-2">
                      <p className="text-xs font-medium text-fg">{appointment.title}</p>
                      <p className="text-[11px] text-fg-subtle">
                        {formatDateTime(appointment.startsAt)} · {APPOINTMENT_KIND_LABELS[appointment.kind]}
                      </p>
                      <p className="text-[11px] text-fg-subtle">{appointment.location}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <MessagesSection
            conversationId={conversation?.id ?? null}
            messages={messages}
            viewerRole="client"
            advisorName={advisor ? fullName(advisor) : 'Votre conseiller'}
            clientName={user.firstName}
          />
        </div>
      </div>
    </div>
  );
}
