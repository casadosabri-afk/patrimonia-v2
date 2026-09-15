'use client';

import { useActionState, useState } from 'react';
import { Check } from 'lucide-react';
import type { Branding } from '@/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, Textarea } from '@/components/ui';
import { LogoMark } from '@/components/layout/Logo';
import { EMPTY_BRANDING_STATE, updateBrandingAction } from '@/app/(app)/admin/actions';

export function BrandingForm({ branding }: { branding: Branding }) {
  const [state, formAction, pending] = useActionState(updateBrandingAction, EMPTY_BRANDING_STATE);
  const [primary, setPrimary] = useState(branding.primaryColor);
  const [accent, setAccent] = useState(branding.accentColor);
  const [name, setName] = useState(branding.firmName);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Identité du cabinet</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <Field label="Nom du cabinet" required>
              {(id) => (
                <Input
                  id={id}
                  name="firmName"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Couleur principale" hint="Utilisée dans les en-têtes de rapport.">
                {(id) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primary}
                      onChange={(event) => setPrimary(event.target.value)}
                      aria-label="Sélecteur de couleur principale"
                      className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-surface"
                    />
                    <Input
                      id={id}
                      name="primaryColor"
                      value={primary}
                      onChange={(event) => setPrimary(event.target.value)}
                      pattern="#[0-9a-fA-F]{6}"
                    />
                  </div>
                )}
              </Field>

              <Field label="Couleur d’accent">
                {(id) => (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accent}
                      onChange={(event) => setAccent(event.target.value)}
                      aria-label="Sélecteur de couleur d’accent"
                      className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-surface"
                    />
                    <Input
                      id={id}
                      name="accentColor"
                      value={accent}
                      onChange={(event) => setAccent(event.target.value)}
                      pattern="#[0-9a-fA-F]{6}"
                    />
                  </div>
                )}
              </Field>
            </div>

            <Field label="URL du logo" hint="Laissez vide pour utiliser le monogramme PATRIMONIA.">
              {(id) => (
                <Input id={id} name="logoUrl" type="url" defaultValue={branding.logoUrl ?? ''} placeholder="https://" />
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de contact" required>
                {(id) => <Input id={id} name="contactEmail" type="email" required defaultValue={branding.contactEmail} />}
              </Field>
              <Field label="Téléphone">
                {(id) => <Input id={id} name="contactPhone" defaultValue={branding.contactPhone} />}
              </Field>
            </div>

            <Field label="Site web">
              {(id) => <Input id={id} name="website" type="url" defaultValue={branding.website ?? ''} placeholder="https://" />}
            </Field>

            <Field label="Mention de pied de page des rapports" required>
              {(id) => <Textarea id={id} name="reportFooter" required defaultValue={branding.reportFooter} />}
            </Field>

            {state.error ? <p className="text-xs text-negative">{state.error}</p> : null}
            {state.success ? (
              <p className="flex items-center gap-1.5 text-xs text-positive">
                <Check className="size-3.5" aria-hidden />
                Identité du cabinet mise à jour.
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" loading={pending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-card border border-border">
            <div className="p-4" style={{ backgroundColor: primary }}>
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: accent }}
                >
                  <LogoMark className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-[10px] text-white/70">Rapport patrimonial</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 bg-surface p-4">
              <div className="h-2 w-2/3 rounded-full bg-surface-2" />
              <div className="h-2 w-1/2 rounded-full bg-surface-2" />
              <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundColor: accent }} />
              <p className="pt-2 text-[10px] text-fg-subtle">{branding.reportFooter}</p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-fg-subtle">
            Ces réglages s’appliquent à l’en-tête de l’application, aux rapports PDF générés et aux documents
            produits pour les clients du cabinet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
