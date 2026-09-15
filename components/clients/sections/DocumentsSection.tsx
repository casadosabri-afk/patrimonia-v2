'use client';

import { useActionState, useState, useTransition } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import type { StoredDocument } from '@/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Modal,
  Select,
  SegmentedControl,
} from '@/components/ui';
import { DOCUMENT_KIND_LABELS } from '@/lib/utils/labels';
import { formatBytes, formatDate } from '@/lib/utils/format';
import { EMPTY_ACTION_STATE, deleteDocumentAction, uploadDocumentAction } from '@/app/(app)/actions';

export function DocumentsSection({
  clientId,
  documents,
  canManage = true,
}: {
  clientId: string;
  documents: StoredDocument[];
  canManage?: boolean;
}) {
  const [filter, setFilter] = useState<string>('tous');
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(uploadDocumentAction, EMPTY_ACTION_STATE);
  const [isPending, startTransition] = useTransition();

  if (state.success && open) setOpen(false);

  const visible = filter === 'tous' ? documents : documents.filter((item) => item.kind === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-fg">Documents</h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            {documents.length} pièce{documents.length > 1 ? 's' : ''} au dossier.
          </p>
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Upload className="size-4" aria-hidden />
            Déposer un document
          </Button>
        ) : null}
      </div>

      <SegmentedControl
        options={[
          { value: 'tous', label: 'Tous' },
          ...Object.entries(DOCUMENT_KIND_LABELS).map(([value, label]) => ({ value, label })),
        ]}
        value={filter}
        onChange={setFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Classement</CardTitle>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucun document"
              description="Déposez un relevé, un contrat ou un justificatif pour compléter le dossier."
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-subtle">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-fg">{document.name}</p>
                    <p className="truncate text-[11px] text-fg-subtle">
                      {formatDate(document.uploadedAt)} · {formatBytes(document.sizeBytes)}
                    </p>
                  </div>

                  <Badge tone="neutral">{DOCUMENT_KIND_LABELS[document.kind]}</Badge>
                  {document.demo ? <Badge tone="info">DEMO</Badge> : null}
                  {!document.visibleToClient ? <Badge tone="warning">Interne</Badge> : null}

                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`/api/documents/${document.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ouvrir ${document.name}`}
                      className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                    >
                      <Download className="size-4" aria-hidden />
                    </a>
                    {canManage ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(() => {
                            void deleteDocumentAction(document.id, clientId);
                          })
                        }
                        aria-label={`Supprimer ${document.name}`}
                        className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-negative-soft hover:text-negative disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-fg-subtle">
        Les documents marqués DEMO appartiennent au jeu de démonstration : ils sont décrits dans le dossier mais
        aucun fichier ne leur est associé. Les documents que vous déposez sont bien stockés et téléchargeables.
      </p>

      {canManage ? (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Déposer un document"
          description="Taille maximale : 5 Mo."
        >
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="clientId" value={clientId} />

            <Field label="Fichier" required>
              {(id) => (
                <input
                  id={id}
                  name="file"
                  type="file"
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:text-fg"
                />
              )}
            </Field>

            <Field label="Catégorie" required>
              {(id) => (
                <Select id={id} name="kind" defaultValue="releve">
                  {Object.entries(DOCUMENT_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <label className="flex items-center gap-2 text-xs text-fg-muted">
              <input type="checkbox" name="visibleToClient" defaultChecked className="size-4 rounded" />
              Visible dans l’espace client
            </label>

            {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={pending}>
                Déposer
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
