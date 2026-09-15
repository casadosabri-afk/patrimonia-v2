import type { Metadata } from 'next';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { CalendarView } from '@/components/calendar/CalendarView';

export const metadata: Metadata = { title: 'Calendrier' };
export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [appointments, interactions, clients] = await Promise.all([
    repository.listAppointments(access),
    repository.listInteractions(access),
    repository.listClients(access),
  ]);

  return (
    <div>
      <PageHeader
        title="Calendrier"
        subtitle="Rendez-vous clients et échéances de tâches, regroupés par jour."
      />
      <CalendarView
        appointments={appointments}
        tasks={interactions.filter((item) => item.kind === 'tache')}
        clients={clients}
      />
    </div>
  );
}
