'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Tabs,
  DisclaimerNote,
} from '@/components/ui';
import {
  DIRECT_LINE_ALLOWANCE,
  IFI_THRESHOLD,
  INVESTMENT_TAX_TABLE,
  TAX_REFERENCE_YEAR,
  TAX_SOURCE_NOTICE,
  simulateIfi,
  simulateIncomeTax,
  simulateTransmission,
  type BracketDetail,
} from '@/lib/tax/france';
import { formatEuro, formatPercent } from '@/lib/utils/format';

export interface TaxClientPreset {
  id: string;
  label: string;
  annualIncome: number;
  parts: number;
  realEstateValue: number;
  primaryResidenceValue: number;
  realEstateDebt: number;
  netWorth: number;
  children: number;
}

function BracketTable({ details }: { details: BracketDetail[] }) {
  if (details.length === 0) {
    return <p className="text-xs text-fg-subtle">Aucune tranche imposable sur cette base.</p>;
  }

  return (
    <div className="overflow-x-auto pat-scroll">
      <table className="w-full min-w-max text-xs">
        <thead>
          <tr className="border-b border-border text-left text-fg-subtle">
            <th className="py-2 pr-4 font-medium">Tranche</th>
            <th className="py-2 pr-4 text-right font-medium">Base imposée</th>
            <th className="py-2 pr-4 text-right font-medium">Taux</th>
            <th className="py-2 text-right font-medium">Montant</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, index) => (
            <tr key={index} className="border-b border-border last:border-0">
              <td className="py-2 pr-4 text-fg-muted">
                {formatEuro(detail.bracket.from)} –{' '}
                {detail.bracket.to === null ? 'au-delà' : formatEuro(detail.bracket.to)}
              </td>
              <td className="py-2 pr-4 text-right text-fg-muted tabular">
                {formatEuro(detail.taxableInBracket)}
              </td>
              <td className="py-2 pr-4 text-right text-fg-muted tabular">
                {formatPercent(detail.bracket.rate, 2)}
              </td>
              <td className="py-2 text-right font-medium text-fg tabular">{formatEuro(detail.tax)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TaxView({ presets }: { presets: TaxClientPreset[] }) {
  const first = presets[0];
  const [tab, setTab] = useState('revenu');
  const [income, setIncome] = useState(first?.annualIncome ?? 60000);
  const [parts, setParts] = useState(first?.parts ?? 1);
  const [realEstate, setRealEstate] = useState(first?.realEstateValue ?? 900000);
  const [primaryResidence, setPrimaryResidence] = useState(first?.primaryResidenceValue ?? 500000);
  const [realEstateDebt, setRealEstateDebt] = useState(first?.realEstateDebt ?? 200000);
  const [estate, setEstate] = useState(first?.netWorth ?? 800000);
  const [children, setChildren] = useState(first?.children || 2);

  const incomeTax = useMemo(() => simulateIncomeTax({ annualIncome: income, parts }), [income, parts]);
  const ifi = useMemo(
    () =>
      simulateIfi({
        realEstateValue: realEstate,
        primaryResidenceValue: primaryResidence,
        realEstateDebt,
      }),
    [realEstate, primaryResidence, realEstateDebt],
  );
  const transmission = useMemo(
    () => simulateTransmission({ estateValue: estate, children }),
    [estate, children],
  );

  const applyPreset = (id: string) => {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setIncome(preset.annualIncome);
    setParts(preset.parts);
    setRealEstate(preset.realEstateValue);
    setPrimaryResidence(preset.primaryResidenceValue);
    setRealEstateDebt(preset.realEstateDebt);
    setEstate(preset.netWorth);
    setChildren(Math.max(1, preset.children));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-soft px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-fg">Simulation pédagogique</p>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
            PATRIMONIA ne produit aucun calcul fiscal officiel. Les résultats ci-dessous illustrent des
            mécanismes d’imposition de façon simplifiée. {TAX_SOURCE_NOTICE}
          </p>
        </div>
      </div>

      {presets.length > 0 ? (
        <Card className="p-4">
          <Field label="Partir de la situation d’un client" hint="Les données restent modifiables ci-dessous.">
            {(id) => (
              <Select id={id} onChange={(event) => applyPreset(event.target.value)} defaultValue="">
                <option value="">Saisie libre</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </Card>
      ) : null}

      <Tabs
        items={[
          { value: 'revenu', label: 'Impôt sur le revenu' },
          { value: 'ifi', label: 'IFI' },
          { value: 'placements', label: 'Fiscalité des placements' },
          { value: 'transmission', label: 'Transmission et succession' },
        ]}
        value={tab}
        onChange={setTab}
        className="rounded-xl bg-surface-2 p-1"
      />

      {tab === 'revenu' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Situation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Revenu annuel imposable (€)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={1000}
                    value={income}
                    onChange={(event) => setIncome(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field label="Nombre de parts fiscales">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={parts}
                    onChange={(event) => setParts(Number(event.target.value))}
                  />
                )}
              </Field>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Impôt estimé</CardTitle>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Barème {TAX_REFERENCE_YEAR}, abattement de 10 % appliqué, quotient familial non plafonné.
                </p>
              </div>
              <Badge tone="warning">Pédagogique</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Revenu imposable', value: formatEuro(incomeTax.taxableIncome) },
                  { label: 'Impôt estimé', value: formatEuro(incomeTax.totalTax) },
                  { label: 'Taux marginal', value: formatPercent(incomeTax.marginalRate, 0) },
                  { label: 'Taux moyen', value: formatPercent(incomeTax.averageRate, 1) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-surface-2 p-3">
                    <p className="text-[11px] text-fg-muted">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-fg tabular">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-fg-muted">
                  Détail par tranche, pour une part de quotient familial
                </p>
                <BracketTable details={incomeTax.details} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'ifi' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Patrimoine immobilier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Valeur totale de l’immobilier (€)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={10000}
                    value={realEstate}
                    onChange={(event) => setRealEstate(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field label="Dont résidence principale (€)" hint="Abattement de 30 % appliqué sur cette valeur.">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={10000}
                    value={primaryResidence}
                    onChange={(event) => setPrimaryResidence(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field label="Dettes immobilières (€)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={10000}
                    value={realEstateDebt}
                    onChange={(event) => setRealEstateDebt(Number(event.target.value))}
                  />
                )}
              </Field>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Impôt sur la fortune immobilière</CardTitle>
              <Badge tone={ifi.liable ? 'warning' : 'positive'}>
                {ifi.liable ? 'Assujetti' : 'Non assujetti'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-[11px] text-fg-muted">Base nette taxable</p>
                  <p className="mt-1 text-base font-semibold text-fg tabular">{formatEuro(ifi.taxableBase)}</p>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <p className="text-[11px] text-fg-muted">Impôt estimé</p>
                  <p className="mt-1 text-base font-semibold text-fg tabular">{formatEuro(ifi.totalTax)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-fg-muted">
                Le seuil d’assujettissement s’élève à {formatEuro(IFI_THRESHOLD)} de patrimoine immobilier net.
                Au-delà, le barème s’applique dès {formatEuro(800000)}.
              </p>
              <div className="mt-4">
                <BracketTable details={ifi.details} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'placements' ? (
        <Card>
          <CardHeader>
            <CardTitle>Fiscalité des enveloppes</CardTitle>
            <Badge tone="warning">Repères indicatifs</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pat-scroll">
              <table className="w-full min-w-max text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-fg-subtle">
                    <th className="py-2 pr-4 font-medium">Enveloppe</th>
                    <th className="py-2 pr-4 font-medium">Imposition des gains</th>
                    <th className="py-2 pr-4 font-medium">Prélèvements sociaux</th>
                    <th className="py-2 font-medium">Point d’attention</th>
                  </tr>
                </thead>
                <tbody>
                  {INVESTMENT_TAX_TABLE.map((row) => (
                    <tr key={row.envelope} className="border-b border-border last:border-0 align-top">
                      <td className="py-2.5 pr-4 font-medium text-fg">{row.envelope}</td>
                      <td className="max-w-xs py-2.5 pr-4 text-fg-muted">{row.taxation}</td>
                      <td className="py-2.5 pr-4 text-fg-muted">{row.socialCharges}</td>
                      <td className="max-w-xs py-2.5 text-fg-subtle">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'transmission' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Situation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Patrimoine transmis (€)">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step={10000}
                    value={estate}
                    onChange={(event) => setEstate(Number(event.target.value))}
                  />
                )}
              </Field>
              <Field label="Nombre d’enfants">
                {(id) => (
                  <Input
                    id={id}
                    type="number"
                    min={1}
                    max={10}
                    value={children}
                    onChange={(event) => setChildren(Number(event.target.value))}
                  />
                )}
              </Field>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transmission en ligne directe</CardTitle>
              <Badge tone="warning">Pédagogique</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Part par enfant', value: formatEuro(transmission.grossPerChild) },
                  { label: 'Abattement', value: formatEuro(transmission.allowance) },
                  { label: 'Droits par enfant', value: formatEuro(transmission.taxPerChild) },
                  { label: 'Taux effectif', value: formatPercent(transmission.effectiveRate, 1) },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-surface-2 p-3">
                    <p className="text-[11px] text-fg-muted">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-fg tabular">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-fg-muted">
                Chaque parent peut transmettre {formatEuro(DIRECT_LINE_ALLOWANCE)} par enfant en franchise de
                droits, cet abattement se reconstituant tous les quinze ans. Les donations anticipées réduisent
                d’autant la base taxable au moment de la succession.
              </p>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-fg-muted">Détail par tranche, part d’un enfant</p>
                <BracketTable details={transmission.details} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <DisclaimerNote>
        Ces simulations ne tiennent pas compte de l’ensemble des situations particulières : plafonnement du
        quotient familial, décote, réductions et crédits d’impôt, régimes matrimoniaux, démembrement, contrats
        d’assurance-vie hors succession, ni des évolutions législatives. Elles ne remplacent pas l’analyse d’un
        professionnel ni les informations publiées par l’administration fiscale.
      </DisclaimerNote>
    </div>
  );
}
