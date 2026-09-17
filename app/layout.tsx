import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { PwaProvider } from '@/components/layout/PwaProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PATRIMONIA — La vision intelligente du patrimoine',
    template: '%s · PATRIMONIA',
  },
  description:
    'Plateforme de gestion de patrimoine pour les cabinets de conseil : consolidation, analyse, risques et opportunités.',
  applicationName: 'PATRIMONIA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PATRIMONIA',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e1a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** Applique le thème avant la peinture pour éviter tout clignotement. */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('patrimonia-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t!=='light'&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <PwaProvider />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
