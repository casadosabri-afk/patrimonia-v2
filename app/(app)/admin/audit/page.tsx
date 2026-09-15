import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Journal d’audit' };
export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const { access } = await requireAccess('admin');
  const entries = await getRepository().listAudit(access, 200);

  return (
    <div>
      <PageHeader
        title="Journal d’audit"
        subtitle="Qui a fait quoi, quand et sur quel objet. Le journal est en lecture seule."
      />

      <Card>
        <CardContent className="p-2 sm:p-4">
          {entries.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Aucune action enregistrée"
              description="Les créations, modifications, traitements d’alertes et générations de rapport sont tracés ici."
            />
          ) : (
            <div className="overflow-x-auto pat-scroll">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-fg-subtle">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Utilisateur</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                    <th className="px-3 py-2 font-medium">Objet</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2.5 text-xs whitespace-nowrap text-fg-subtle tabular">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-medium text-fg">{entry.userLabel}</td>
                      <td className="px-3 py-2.5">
                        <Badge tone="neutral">{entry.action}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-fg-muted">
                        {entry.targetLabel ?? entry.targetId ?? '—'}
                        <span className="ml-1.5 text-[10px] text-fg-subtle">({entry.targetType})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
