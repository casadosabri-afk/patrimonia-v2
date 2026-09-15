'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';

const FIELD_BASE =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-colors focus:border-accent-400 focus:outline-none disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(FIELD_BASE, 'h-10', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(FIELD_BASE, 'min-h-24 resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(FIELD_BASE, 'h-10 cursor-pointer appearance-none bg-no-repeat pr-8', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b94a7' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.6rem center',
        }}
        {...props}
      />
    );
  },
);

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (id: string) => React.ReactNode;
}

/** Enveloppe label + aide + message d'erreur, reliée par `id` au contrôle. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-fg-muted">
        {label}
        {required ? <span className="ml-0.5 text-negative">*</span> : null}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-negative">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
