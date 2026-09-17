'use client';

import { useActionState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Client, UserAccount } from '@/types';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { CLIENT_STATUS_LABELS, RISK_PROFILE_LABELS } from '@/lib/utils/labels';
import { fullName } from '@/lib/utils/format';
import { EMPTY_CLIENT_FORM_STATE, type ClientFormState } from '@/app/(app)/clients/actions';

export function ClientForm({
  advisors,
  client,
  action,
  submitLabel,
  onDone,
}: {
  advisors: UserAccount[];
  client?: Client;
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  submitLabel: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY_CLIENT_FORM_STATE);

  // Le parent est notifié après le rendu, jamais pendant.
  useEffect(() => {
    if (state.success) onDone?.();
  }, [state.success, onDone]);

  const primary = client?.advisors.find((link) => link.primary)?.advisorId ?? advisors[0]?.id ?? '';
  const associates = client?.advisors.filter((link) => !link.primary).map((link) => link.advisorId) ?? [];

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" required error={state.fieldErrors.firstName}>
          {(id) => <Input id={id} name="firstName" defaultValue={client?.firstName} required />}
        </Field>
        <Field label="Nom" required error={state.fieldErrors.lastName}>
          {(id) => <Input id={id} name="lastName" defaultValue={client?.lastName} required />}
        </Field>
        <Field label="Adresse e-mail" required error={state.fieldErrors.email}>
          {(id) => <Input id={id} name="email" type="email" defaultValue={client?.email} required />}
        </Field>
        <Field label="Téléphone" error={state.fieldErrors.phone}>
          {(id) => <Input id={id} name="phone" defaultValue={client?.phone} placeholder="06 12 34 56 78" />}
        </Field>
        <Field label="Date de naissance" required error={state.fieldErrors.birthDate}>
          {(id) => <Input id={id} name="birthDate" type="date" defaultValue={client?.birthDate} required />}
        </Field>
        <Field label="Profession" error={state.fieldErrors.profession}>
          {(id) => <Input id={id} name="profession" defaultValue={client?.profession} />}
        </Field>
        <Field label="Ville" error={state.fieldErrors.city}>
          {(id) => <Input id={id} name="city" defaultValue={client?.city} />}
        </Field>
        <Field label="Code postal" error={state.fieldErrors.postalCode}>
          {(id) => <Input id={id} name="postalCode" defaultValue={client?.postalCode} inputMode="numeric" />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Profil de risque" required>
          {(id) => (
            <Select id={id} name="riskProfile" defaultValue={client?.riskProfile ?? 'equilibre'}>
              {Object.entries(RISK_PROFILE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Statut" required>
          {(id) => (
            <Select id={id} name="status" defaultValue={client?.status ?? 'prospect'}>
              {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label="Horizon de placement (années)"
          required
          error={state.fieldErrors.horizonYears}
          hint="Durée pendant laquelle le capital peut rester investi."
        >
          {(id) => (
            <Input id={id} name="horizonYears" type="number" min={1} max={60} defaultValue={client?.horizonYears ?? 10} required />
          )}
        </Field>
        <Field label="Tranche marginale d’imposition (%)" error={state.fieldErrors.taxBracketRate}>
          {(id) => (
            <Input id={id} name="taxBracketRate" type="number" min={0} max={60} step={1} defaultValue={client?.taxBracketRate ?? 30} />
          )}
        </Field>
        <Field label="Revenus annuels (€)" error={state.fieldErrors.annualIncome}>
          {(id) => <Input id={id} name="annualIncome" type="number" min={0} step={1000} defaultValue={client?.annualIncome ?? 0} />}
        </Field>
        <Field label="Dépenses annuelles (€)" error={state.fieldErrors.annualExpenses}>
          {(id) => <Input id={id} name="annualExpenses" type="number" min={0} step={1000} defaultValue={client?.annualExpenses ?? 0} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Conseiller principal" required error={state.fieldErrors.primaryAdvisorId}>
          {(id) => (
            <Select id={id} name="primaryAdvisorId" defaultValue={primary}>
              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {fullName(advisor)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Conseillers associés" hint="Maintenez Ctrl (ou Cmd) pour en sélectionner plusieurs.">
          {(id) => (
            <select
              id={id}
              name="associateAdvisorIds"
              multiple
              defaultValue={associates}
              className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent-400 focus:outline-none"
            >
              {advisors.map((advisor) => (
                <option key={advisor.id} value={advisor.id}>
                  {fullName(advisor)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label="Notes internes">
        {(id) => <Textarea id={id} name="notes" defaultValue={client?.notes ?? ''} placeholder="Contexte, projets, points de vigilance…" />}
      </Field>

      {state.error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-negative-soft px-3 py-2 text-xs text-negative">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
