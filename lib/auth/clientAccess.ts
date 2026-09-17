import 'server-only';

import { notFound } from 'next/navigation';
import { requireAccess } from '@/lib/auth/session';
import { getClientOverview, type ClientOverview } from '@/services/portfolio';
import type { AccessContext } from '@/services/db/access';
import type { SessionUser } from '@/types';

/**
 * Résout le dossier du client connecté.
 *
 * L'identifiant du dossier provient du profil serveur, jamais de l'URL ni d'un
 * paramètre : un client ne peut donc pas consulter un autre dossier.
 */
export async function requireClientOverview(): Promise<{
  user: SessionUser;
  access: AccessContext;
  overview: ClientOverview;
}> {
  const { user, access } = await requireAccess('client');
  if (!user.clientId) notFound();

  const overview = await getClientOverview(access, user.clientId);
  if (!overview) notFound();

  return { user, access, overview };
}
