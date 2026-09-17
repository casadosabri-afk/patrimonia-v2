import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/layout/Logo';

export const metadata: Metadata = { title: 'Hors connexion' };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mb-4 flex justify-center">
          <Logo showTagline />
        </div>
        <WifiOff className="mx-auto size-8 text-fg-subtle" aria-hidden />
        <h1 className="mt-3 text-lg font-semibold text-fg">Vous êtes hors connexion</h1>
        <p className="mt-2 text-sm text-fg-muted">
          PATRIMONIA nécessite une connexion pour afficher les dossiers clients et les données de marché. Aucune
          donnée client n’est conservée sur l’appareil.
        </p>
        <p className="mt-4 text-xs text-fg-subtle">
          Reconnectez-vous au réseau, puis actualisez la page.
        </p>
      </Card>
    </main>
  );
}
