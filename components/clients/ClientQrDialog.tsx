'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, RefreshCw } from 'lucide-react';
import { Button, Modal, SegmentedControl, Skeleton } from '@/components/ui';
import { formatDateTime } from '@/lib/utils/format';
import { createQrTokenAction } from '@/lib/qr/actions';

type Scope = 'client_file' | 'client_portal';

export function ClientQrDialog({
  open,
  onClose,
  clientId,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}) {
  const [scope, setScope] = useState<Scope>('client_file');
  const [ttl, setTtl] = useState('15');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);

    const result = await createQrTokenAction(clientId, scope, Number(ttl));
    if (!result.url) {
      setError(result.error ?? 'Génération impossible.');
      setDataUrl(null);
      setLink(null);
    } else {
      setLink(result.url);
      setExpiresAt(result.expiresAt);
      setDataUrl(
        await QRCode.toDataURL(result.url, {
          width: 320,
          margin: 1,
          color: { dark: '#0b1020', light: '#ffffff' },
        }),
      );
    }
    setLoading(false);
  }, [clientId, scope, ttl]);

  useEffect(() => {
    if (open) void generate();
  }, [open, generate]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accès par QR code"
      description={`Lien temporaire vers le dossier de ${clientName}.`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            options={[
              { value: 'client_file', label: 'Dossier conseiller' },
              { value: 'client_portal', label: 'Espace client' },
            ]}
            value={scope}
            onChange={(value) => setScope(value as Scope)}
          />
          <select
            value={ttl}
            onChange={(event) => setTtl(event.target.value)}
            aria-label="Durée de validité"
            className="h-8 rounded-xl border border-border bg-surface px-2 text-xs text-fg"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 heure</option>
          </select>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface-2 p-5">
          {loading ? (
            <Skeleton className="size-56" />
          ) : dataUrl ? (
            // Le QR est généré côté navigateur à partir de l'URL signée.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt="QR code d’accès temporaire" className="size-56 rounded-xl bg-white p-2" />
          ) : (
            <p className="py-16 text-xs text-negative">{error}</p>
          )}

          {expiresAt && !loading ? (
            <p className="text-[11px] text-fg-subtle">Valable jusqu’à {formatDateTime(expiresAt)}, usage unique.</p>
          ) : null}
        </div>

        {link ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-[11px] text-fg-muted">{link}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link);
                setCopied(true);
              }}
              className="shrink-0 rounded-lg p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
              aria-label="Copier le lien"
            >
              <Copy className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}

        {copied ? <p className="text-[11px] text-positive">Lien copié.</p> : null}

        <p className="text-[11px] leading-relaxed text-fg-subtle">
          Le QR code ne contient aucune donnée personnelle : seul un jeton aléatoire y figure. Ce jeton expire
          automatiquement et ne peut être utilisé qu’une fois. L’ouverture du dossier reste soumise à une
          connexion et aux droits de l’utilisateur.
        </p>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => void generate()} loading={loading}>
            <RefreshCw className="size-3.5" aria-hidden />
            Régénérer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
