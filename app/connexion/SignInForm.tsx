'use client';

import { useActionState, useState } from 'react';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button, Field, Input } from '@/components/ui';
import { Logo, LogoMark } from '@/components/layout/Logo';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/lib/auth/demoAccounts';
import { signIn, type SignInState } from '@/lib/auth/actions';
import { ROLE_LABELS } from '@/lib/utils/labels';
import { cn } from '@/lib/utils/cn';

const INITIAL: SignInState = { error: null };

export function SignInForm({ supabaseEnabled }: { supabaseEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(signIn, INITIAL);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0]?.email ?? '');
  const [password, setPassword] = useState(supabaseEnabled ? '' : DEMO_PASSWORD);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Panneau de marque */}
      <section className="pat-grid-bg relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-10 lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <p className="text-lg font-semibold tracking-tight text-white">PATRIMONIA</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            La vision intelligente du patrimoine.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Consolidez le patrimoine de vos clients, identifiez les risques et les opportunités,
            et sachez immédiatement quels dossiers méritent votre attention aujourd’hui.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              'Patrimoine consolidé et réparti par classe d’actifs',
              'Analyse automatique des risques et opportunités',
              'Score de cohérence explicable, facteur par facteur',
              'Cours et historiques issus de données de marché réelles',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          Projet de démonstration. Les données clients sont entièrement fictives.
        </p>
      </section>

      {/* Formulaire */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo showTagline />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-fg">Connexion</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {supabaseEnabled
              ? 'Authentification assurée par Supabase Auth.'
              : 'Mode démonstration : choisissez un profil ci-dessous.'}
          </p>

          <form action={formAction} className="mt-6 space-y-4">
            <Field label="Adresse e-mail" required>
              {(id) => (
                <Input
                  id={id}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="prenom@cabinet.fr"
                />
              )}
            </Field>

            <Field label="Mot de passe" required>
              {(id) => (
                <Input
                  id={id}
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>

            {state.error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-negative-soft px-3 py-2 text-xs text-negative"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {state.error}
              </p>
            ) : null}

            <Button type="submit" loading={pending} className="w-full" size="lg">
              Se connecter
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </form>

          {!supabaseEnabled ? (
            <div className="mt-8">
              <p className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
                <Sparkles className="size-3.5 text-accent-500" aria-hidden />
                Comptes de démonstration
              </p>
              <ul className="mt-2 space-y-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(account.email);
                        setPassword(DEMO_PASSWORD);
                      }}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2.5 text-left transition-colors',
                        email === account.email
                          ? 'border-accent-300 bg-accent-50'
                          : 'border-border bg-surface hover:bg-surface-2',
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-fg">{account.label}</span>
                        <span className="shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-subtle">
                          {ROLE_LABELS[account.role]}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-fg-subtle">{account.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-fg-subtle">
                Mot de passe commun : <span className="font-mono text-fg-muted">{DEMO_PASSWORD}</span>. Ces
                comptes n’existent que dans le jeu de démonstration.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
