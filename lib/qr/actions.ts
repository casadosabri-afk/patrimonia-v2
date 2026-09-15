'use server';

import { z } from 'zod';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { appUrl } from '@/lib/env';

const schema = z.object({
  clientId: z.string().min(1),
  scope: z.enum(['client_file', 'client_portal']),
  ttlMinutes: z.coerce.number().int().min(5).max(120),
});

export interface QrTokenResult {
  url: string | null;
  expiresAt: string | null;
  error: string | null;
}

/**
 * Génère un accès QR temporaire.
 *
 * Le QR code ne contient que l'URL porteuse d'un jeton opaque à usage unique.
 * Aucune donnée personnelle n'y figure, et le jeton expire automatiquement.
 */
export async function createQrTokenAction(
  clientId: string,
  scope: string,
  ttlMinutes: number,
): Promise<QrTokenResult> {
  const { access } = await requireAccess('advisor', 'admin');
  const parsed = schema.safeParse({ clientId, scope, ttlMinutes });

  if (!parsed.success) return { url: null, expiresAt: null, error: 'Paramètres invalides.' };

  try {
    const token = await getRepository().createQrToken(
      access,
      parsed.data.clientId,
      parsed.data.scope,
      parsed.data.ttlMinutes,
    );
    return {
      url: `${appUrl()}/qr/${token.token}`,
      expiresAt: token.expiresAt,
      error: null,
    };
  } catch {
    return { url: null, expiresAt: null, error: 'La génération du lien a échoué.' };
  }
}
