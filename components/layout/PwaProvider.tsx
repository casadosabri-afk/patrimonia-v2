'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'patrimonia-install-dismissed';

/**
 * Enregistre le service worker et propose l'installation sur mobile.
 *
 * Le bandeau n'apparaît que si le navigateur déclare l'application
 * installable ; il n'est jamais affiché comme un faux bouton.
 */
export function PwaProvider() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // L'échec d'enregistrement ne doit jamais bloquer l'application.
      });
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!prompt) return null;

  const dismiss = () => {
    setPrompt(null);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Sans stockage, le bandeau pourra réapparaître : comportement acceptable.
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 lg:inset-x-auto lg:right-4 lg:bottom-4 lg:max-w-sm">
      <div className="flex items-start gap-3 rounded-card border border-border bg-elevated p-3.5 shadow-pop">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <Download className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">Installer PATRIMONIA</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Ajoutez l’application à votre écran d’accueil pour un accès direct.
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await prompt.prompt();
                await prompt.userChoice;
                setPrompt(null);
              }}
            >
              Installer
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Plus tard
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="rounded p-0.5 text-fg-subtle hover:text-fg"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
