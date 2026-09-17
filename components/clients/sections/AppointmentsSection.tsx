'use client';

import { useActionState, useEffect, useState } from 'react';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import type { Appointment } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import { APPOINTMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatDateTime } from '@/lib/utils/format';
import { EMPTY_ACTION_STATE, createAppointmentAction } from '@/app/(app)/actions';

export function AppointmentsSection({
  clientId,
  appointments,
}: {
  clientId: string;
  appointments: Appointment[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createAppointmentAction, EMPTY_ACTION_STATE);
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const now = Date.now();
  const upcoming = appointments.filter((item) => new Date(item.startsAt).getTime() >= now);
  const past = appointments
    .filter((item) => new Date(item.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  const renderList = (items: Appointment[]) => (
    <ul className="space-y-2">
      {items.map((appointment) => (
        <li
          key={appointment.id}
          className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5"
        >
          <CalendarDays className="size-4 shrink-0 text-fg-subtle" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-fg">{appointment.title}</p>
            <p className="truncate text-[11px] text-fg-subtle">
              {formatDateTime(appointment.startsAt)} · {appointment.durationMin} min
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] text-fg-subtle">
            <MapPin className="size-3" aria-hidden />
            {appointment.location}
          </span>
          <Badge
            tone={
              appointment.status === 'confirme'
                ? 'positive'
                : appointment.status === 'annule'
                  ? 'negative'
                  : appointment.status === 'realise'
                    ? 'neutral'
                    : 'info'
            }
          >
            {APPOINTMENT_KIND_LABELS[appointment.kind]}
          </Badge>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-fg">Rendez-vous</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden />
          Planifier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>À venir</CardTitle>
          <Badge tone="accent">{upcoming.length}</Badge>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Aucun rendez-vous à venir" />
          ) : (
            renderList(upcoming)
          )}
        </CardContent>
      </Card>

      {past.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>{renderList(past.slice(0, 8))}</CardContent>
        </Card>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Planifier un rendez-vous">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />

          <Field label="Type" required>
            {(id) => (
              <Select id={id} name="kind" defaultValue="suivi">
                {Object.entries(APPOINTMENT_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Intitulé" required>
            {(id) => <Input id={id} name="title" required defaultValue="Rendez-vous de suivi" />}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date et heure" required>
              {(id) => <Input id={id} name="startsAt" type="datetime-local" required />}
            </Field>
            <Field label="Durée (minutes)" required>
              {(id) => (
                <Input id={id} name="durationMin" type="number" min={15} max={480} step={15} defaultValue={60} />
              )}
            </Field>
          </div>

          <Field label="Lieu">
            {(id) => <Input id={id} name="location" defaultValue="Visioconférence" />}
          </Field>

          <Field label="Notes">{(id) => <Textarea id={id} name="notes" />}</Field>

          {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={pending}>
              Planifier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
