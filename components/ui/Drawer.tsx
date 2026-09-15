'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  widthClass = 'sm:max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'right' | 'left';
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col border-border bg-surface shadow-pop',
          widthClass,
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau"
            className="rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto pat-scroll px-5 py-4">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
