import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DOCUMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatBytes, formatDate } from '@/lib/utils/format';

export const metadata: Metadata = { title: 'Mes documents' };
export const dynamic = 'force-dynamic';

export default async function ClientDocumentsPage() {
  const { access } = await requireAccess('client');
  const documents = await getRepository().listDocuments(access);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vos documents"
        subtitle="Les pièces que votre conseiller a mises à votre disposition."
      />

      <Card>
        <CardContent className="p-2 sm:p-4">
          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun document"
              description="Votre conseiller n’a pas encore partagé de document avec vous."
            />
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-subtle">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{document.name}</p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {formatDate(document.uploadedAt, 'long')} · {formatBytes(document.sizeBytes)}
                    </p>
                  </div>
                  <Badge tone="neutral">{DOCUMENT_KIND_LABELS[document.kind]}</Badge>
                  {document.demo ? <Badge tone="info">DEMO</Badge> : null}
                  <a
                    href={`/api/documents/${document.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium text-accent-700 hover:underline"
                  >
                    Ouvrir
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-fg-subtle">
        Les documents marqués DEMO font partie du jeu de démonstration : ils sont listés à titre d’exemple et
        aucun fichier ne leur est associé.
      </p>
    </div>
  );
}
