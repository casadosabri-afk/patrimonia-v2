import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getSessionUser } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';

export const metadata: Metadata = { title: 'Accès sécurisé' };
export const dynamic = 'force-dynamic';

/**
 * Point d'entrée d'un accès QR.
 *
 * Le jeton est validé côté serveur (existence, expiration, usage unique) puis
 * consommé. Il ne donne jamais accès à lui seul : l'utilisateur doit être
 * connecté et disposer des droits sur le cabinet concerné.
 */
export default async function QrEntryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/connexion?redirect=${encodeURIComponent(`/qr/${token}`)}`);
  }

  const entry = await getRepository().consumeQrToken(token);

  if (!entry || entry.firmId !== user.firmId) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-5">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo showTagline />
          </div>
          <ShieldAlert className="mx-auto size-8 text-negative" aria-hidden />
          <h1 className="mt-3 text-lg font-semibold text-fg">Lien non valide</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Ce lien a expiré, a déjà été utilisé, ou ne concerne pas votre cabinet. Demandez la génération d’un
            nouveau QR code.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-accent-500 px-4 text-sm font-medium text-white"
          >
            Retour au tableau de bord
          </Link>
        </Card>
      </main>
    );
  }

  if (entry.scope === 'client_portal' && user.role === 'client') {
    redirect('/espace-client');
  }

  if (user.role === 'client') {
    redirect('/espace-client');
  }

  redirect(`/clients/${entry.clientId}`);
}
