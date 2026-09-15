'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import type { Appointment, Client, Interaction } from '@/types';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { APPOINTMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatTime, fullName } from '@/lib/utils/format';
import { addDays, isSameDay, startOfWeek, startOfMonth } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

interface DayEvent {
  id: string;
  kind: 'rendez_vous' | 'tache';
  label: string;
  clientId: string;
  date: Date;
  detail: string;
}

export function CalendarView({
  appointments,
  tasks,
  clients,
}: {
  appointments: Appointment[];
  tasks: Interaction[];
  clients: Client[];
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());

  const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);

  const events = useMemo<DayEvent[]>(
    () => [
      ...appointments
        .filter((item) => item.status !== 'annule')
        .map((item) => ({
          id: item.id,
          kind: 'rendez_vous' as const,
          label: item.title,
          clientId: item.clientId,
          date: new Date(item.startsAt),
          detail: `${APPOINTMENT_KIND_LABELS[item.kind]} · ${item.location}`,
        })),
      ...tasks
        .filter((item) => item.dueAt && item.status !== 'termine')
        .map((item) => ({
          id: item.id,
          kind: 'tache' as const,
          label: item.title,
          clientId: item.clientId,
          date: new Date(item.dueAt as string),
          detail: 'Échéance de tâche',
        })),
    ],
    [appointments, tasks],
  );

  // Grille de six semaines commençant le lundi précédant le 1er du mois.
  const gridStart = startOfWeek(cursor);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

  const eventsForDay = (day: Date) => events.filter((event) => isSameDay(event.date, day));
  const selectedEvents = eventsForDay(selected).sort((a, b) => a.date.getTime() - b.date.getTime());

  const shiftMonth = (delta: number) => {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(startOfMonth(next));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="capitalize">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => shiftMonth(-1)} aria-label="Mois précédent">
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const today = new Date();
                setCursor(startOfMonth(today));
                setSelected(today);
              }}
            >
              Aujourd’hui
            </Button>
            <Button size="icon" variant="ghost" onClick={() => shiftMonth(1)} aria-label="Mois suivant">
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <p key={day} className="pb-1 text-[10px] font-medium text-fg-subtle">
                {day}
              </p>
            ))}
            {days.map((day) => {
              const dayEvents = eventsForDay(day);
              const outside = day.getMonth() !== cursor.getMonth();
              const today = isSameDay(day, new Date());
              const active = isSameDay(day, selected);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-start rounded-lg p-1 transition-colors sm:aspect-auto sm:min-h-16',
                    outside ? 'text-fg-subtle/50' : 'text-fg',
                    active ? 'bg-accent-50 ring-1 ring-accent-300' : 'hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-[11px] font-medium tabular',
                      today && 'bg-accent-500 text-white',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 ? (
                    <span className="mt-0.5 flex gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            'size-1.5 rounded-full',
                            event.kind === 'rendez_vous' ? 'bg-accent-500' : 'bg-warning',
                          )}
                          aria-hidden
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-4 text-[11px] text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-accent-500" aria-hidden />
              Rendez-vous
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-warning" aria-hidden />
              Échéance de tâche
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{formatDate(selected, 'long')}</CardTitle>
          <Badge tone="neutral">{selectedEvents.length}</Badge>
        </CardHeader>
        <CardContent>
          {selectedEvents.length === 0 ? (
            <EmptyState title="Journée libre" description="Aucun rendez-vous ni échéance ce jour-là." />
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((event) => {
                const client = clientsById.get(event.clientId);
                return (
                  <li key={event.id}>
                    <Link
                      href={`/clients/${event.clientId}?section=${event.kind === 'tache' ? 'crm' : 'rendez-vous'}`}
                      className="block rounded-xl bg-surface-2 px-3 py-2.5 transition-colors hover:bg-bg-subtle"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            event.kind === 'rendez_vous' ? 'bg-accent-500' : 'bg-warning',
                          )}
                          aria-hidden
                        />
                        <p className="min-w-0 flex-1 truncate text-xs font-medium text-fg">{event.label}</p>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] text-fg-subtle">
                          <Clock className="size-3" aria-hidden />
                          {formatTime(event.date)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                        {client ? fullName(client) : 'Client'}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-fg-subtle">
                        <MapPin className="size-3" aria-hidden />
                        {event.detail}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
