import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import type { Appointment, Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { APPOINTMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatDate, formatTime, fullName } from '@/lib/utils/format';

export function UpcomingAppointments({
  appointments,
  clientsById,
  limit = 5,
}: {
  appointments: Appointment[];
  clientsById: Map<string, Client>;
  limit?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochains rendez-vous</CardTitle>
        <Link href="/calendrier" className="text-xs font-medium text-accent-700 hover:underline">
          Calendrier
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun rendez-vous à venir"
            description="Planifiez un point avec vos clients depuis le calendrier."
          />
        ) : (
          <ul className="space-y-2">
            {appointments.slice(0, limit).map((appointment) => {
              const client = clientsById.get(appointment.clientId);
              return (
                <li key={appointment.id}>
                  <Link
                    href={`/clients/${appointment.clientId}?section=rendez-vous`}
                    className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 transition-colors hover:bg-bg-subtle"
                  >
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-[10px] tracking-wide text-fg-subtle uppercase">
                        {formatDate(appointment.startsAt, 'day')}
                      </p>
                      <p className="text-sm font-semibold text-fg tabular">
                        {formatTime(appointment.startsAt)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-fg">
                        {client ? fullName(client) : 'Client'}
                      </p>
                      <p className="truncate text-[11px] text-fg-subtle">
                        {APPOINTMENT_KIND_LABELS[appointment.kind]}
                      </p>
                    </div>
                    <span className="hidden shrink-0 items-center gap-1 text-[11px] text-fg-subtle sm:flex">
                      <MapPin className="size-3" aria-hidden />
                      {appointment.location}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
