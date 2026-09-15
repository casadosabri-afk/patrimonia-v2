import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DOCUMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatBytes, formatDate, fullName } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Documents' };
export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const { access } = await requireAccess('advisor', 'admin');
  const repository = getRepository();

  const [documents, clients] = await Promise.all([
    repository.listDocuments(access),
    repository.listClients(access),
  ]);

  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const byKind = new Map<string, typeof documents>();
  for (const document of documents) {
    byKind.set(document.kind, [...(byKind.get(document.kind) ?? []), document]);
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} pièce(s) réparties sur ${clients.length} dossier(s). Le dépôt se fait depuis la fiche client.`}
      />

      {documents.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="Aucun document" description="Aucune pièce n’est encore enregistrée." />
        </Card>
      ) : (
        <div className="space-y-4">
          {[...byKind.entries()].map(([kind, items]) => (
            <Card key={kind}>
              <CardHeader>
                <CardTitle>{DOCUMENT_KIND_LABELS[kind as keyof typeof DOCUMENT_KIND_LABELS]}</CardTitle>
                <Badge tone="neutral">{items.length}</Badge>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {items.slice(0, 12).map((document) => {
                    const client = clientsById.get(document.clientId);
                    return (
                      <li key={document.id} className="flex flex-wrap items-center gap-3 py-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-subtle">
                          <FileText className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-fg">{document.name}</p>
                          {client ? (
                            <Link
                              href={`/clients/${client.id}?section=documents`}
                              className="text-[11px] text-accent-700 hover:underline"
                            >
                              {fullName(client)}
                            </Link>
                          ) : null}
                        </div>
                        <span className="text-[11px] text-fg-subtle">
                          {formatDate(document.uploadedAt)} · {formatBytes(document.sizeBytes)}
                        </span>
                        {document.demo ? <Badge tone="info">DEMO</Badge> : null}
                        <a
                          href={`/api/documents/${document.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-accent-700 hover:underline"
                        >
                          Ouvrir
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
