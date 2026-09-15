import 'server-only';

import { jsPDF } from 'jspdf';
import type {
  Branding,
  Client,
  CoherenceScore,
  GoalProjection,
  Insight,
  Patrimony,
  ValuedInvestment,
} from '@/types';
import { RISK_PROFILE_LABELS } from '@/lib/utils/labels';
import { ageFromBirthDate, formatDate, formatEuro, formatPercent } from '@/lib/utils/format';

export interface ReportInput {
  branding: Branding;
  client: Client;
  patrimony: Patrimony;
  investments: ValuedInvestment[];
  insights: Insight[];
  score: CoherenceScore;
  goals: GoalProjection[];
  advisorName: string;
  advisorComment: string | null;
  actionPlan: string[];
  priceOrigin: 'live' | 'mock' | 'fixture';
  priceProvider: string;
}

const MARGIN = 16;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const SLICE_COLORS: [number, number, number][] = [
  [0, 169, 127],
  [65, 82, 171],
  [240, 169, 94],
  [47, 95, 208],
  [209, 101, 111],
  [89, 214, 178],
  [141, 156, 221],
  [181, 116, 26],
];

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized,
    16,
  );
  if (!Number.isFinite(value)) return [21, 27, 59];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/**
 * Générateur de rapport patrimonial.
 *
 * Le document reprend l'identité visuelle du cabinet (nom, couleurs,
 * coordonnées) et porte en pied de page la mention indiquant qu'il s'agit d'un
 * document pédagogique construit sur des données de démonstration.
 */
export function buildClientReport(input: ReportInput): ArrayBuffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const primary = hexToRgb(input.branding.primaryColor);
  const accent = hexToRgb(input.branding.accentColor);

  let cursor = 0;

  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', gray = 30) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(gray);
  };

  const ensureSpace = (needed: number) => {
    if (cursor + needed > PAGE_HEIGHT - 26) {
      addPage();
    }
  };

  const drawFooter = (pageNumber: number) => {
    doc.setDrawColor(226, 229, 236);
    doc.line(MARGIN, PAGE_HEIGHT - 18, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 18);
    setFont(7, 'normal', 130);
    const footer = doc.splitTextToSize(input.branding.reportFooter, CONTENT_WIDTH - 20);
    doc.text(footer, MARGIN, PAGE_HEIGHT - 13);
    doc.text(`${pageNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 13, { align: 'right' });
  };

  const addPage = () => {
    drawFooter(doc.getNumberOfPages());
    doc.addPage();
    cursor = MARGIN;
    setFont(8, 'normal', 150);
    doc.text(input.branding.firmName, MARGIN, 10);
    doc.text(`${input.client.firstName} ${input.client.lastName}`, PAGE_WIDTH - MARGIN, 10, {
      align: 'right',
    });
  };

  const sectionTitle = (title: string) => {
    ensureSpace(16);
    cursor += 4;
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(MARGIN, cursor - 3.2, 2, 4.5, 'F');
    setFont(11, 'bold', 25);
    doc.text(title, MARGIN + 5, cursor);
    cursor += 6;
  };

  const paragraph = (text: string, size = 8.5, gray = 90) => {
    setFont(size, 'normal', gray);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    ensureSpace(lines.length * (size * 0.42) + 3);
    doc.text(lines, MARGIN, cursor);
    cursor += lines.length * (size * 0.42) + 3;
  };

  // ------------------------------------------------------------ Page de garde
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, PAGE_WIDTH, 62, 'F');

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(MARGIN, 16, 11, 11, 2.5, 2.5, 'F');
  setFont(13, 'bold', 255);
  doc.setTextColor(255, 255, 255);
  doc.text(input.branding.firmName, MARGIN + 15, 24);
  setFont(8, 'normal');
  doc.setTextColor(215, 220, 235);
  doc.text('Généré avec PATRIMONIA — La vision intelligente du patrimoine', MARGIN + 15, 29);

  doc.setTextColor(255, 255, 255);
  setFont(22, 'bold');
  doc.text('Rapport patrimonial', MARGIN, 46);
  setFont(10, 'normal');
  doc.setTextColor(220, 226, 240);
  doc.text(
    `${input.client.firstName} ${input.client.lastName} · ${formatDate(new Date(), 'long')}`,
    MARGIN,
    53,
  );

  cursor = 74;

  // -------------------------------------------------------------- Identité --
  sectionTitle('Informations client');
  const identity: [string, string][] = [
    ['Client', `${input.client.firstName} ${input.client.lastName}`],
    ['Âge', `${ageFromBirthDate(input.client.birthDate)} ans`],
    ['Profession', input.client.profession || '—'],
    ['Ville', `${input.client.city} ${input.client.postalCode}`.trim() || '—'],
    ['Profil de risque', RISK_PROFILE_LABELS[input.client.riskProfile]],
    ['Horizon déclaré', `${input.client.horizonYears} ans`],
    ['Conseiller principal', input.advisorName],
    ['Revenus annuels', formatEuro(input.client.annualIncome)],
  ];

  identity.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (CONTENT_WIDTH / 2);
    const y = cursor + row * 7;
    setFont(7.5, 'normal', 140);
    doc.text(label, x, y);
    setFont(9, 'bold', 30);
    doc.text(value, x, y + 4);
  });
  cursor += Math.ceil(identity.length / 2) * 7 + 4;

  // ------------------------------------------------------------ Patrimoine --
  sectionTitle('Synthèse patrimoniale');

  const figures: [string, string][] = [
    ['Patrimoine net', formatEuro(input.patrimony.netWorth)],
    ['Actif brut', formatEuro(input.patrimony.grossAssets)],
    ['Endettement', formatEuro(input.patrimony.totalDebt)],
    ['Liquidités', formatEuro(input.patrimony.liquidity)],
    ['Immobilier', formatEuro(input.patrimony.realEstateValue)],
    ['Placements financiers', formatEuro(input.patrimony.financialValue)],
  ];

  const boxWidth = (CONTENT_WIDTH - 8) / 3;
  figures.forEach(([label, value], index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = MARGIN + column * (boxWidth + 4);
    const y = cursor + row * 20;

    doc.setFillColor(246, 247, 249);
    doc.roundedRect(x, y, boxWidth, 16, 2, 2, 'F');
    setFont(7, 'normal', 130);
    doc.text(label, x + 3, y + 5.5);
    setFont(11, 'bold', 25);
    doc.text(value, x + 3, y + 12);
  });
  cursor += Math.ceil(figures.length / 3) * 20 + 2;

  // ----------------------------------------------------------- Répartition --
  sectionTitle('Répartition du patrimoine');

  const total = input.patrimony.grossAssets || 1;
  const barY = cursor;
  let barX = MARGIN;

  input.patrimony.allocation.forEach((slice, index) => {
    const width = (slice.value / total) * CONTENT_WIDTH;
    const color = SLICE_COLORS[index % SLICE_COLORS.length] ?? [0, 169, 127];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(barX, barY, Math.max(width, 0.6), 7, 'F');
    barX += width;
  });
  cursor += 11;

  input.patrimony.allocation.forEach((slice, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (CONTENT_WIDTH / 2);
    const y = cursor + row * 5.5;
    const color = SLICE_COLORS[index % SLICE_COLORS.length] ?? [0, 169, 127];

    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(x + 1.4, y - 1.2, 1.4, 'F');
    setFont(8, 'normal', 70);
    doc.text(slice.label, x + 4.5, y);
    setFont(8, 'bold', 30);
    doc.text(
      `${formatPercent(slice.sharePct, 1)}  ·  ${formatEuro(slice.value)}`,
      MARGIN + column * (CONTENT_WIDTH / 2) + CONTENT_WIDTH / 2 - 4,
      y,
      { align: 'right' },
    );
  });
  cursor += Math.ceil(input.patrimony.allocation.length / 2) * 5.5 + 4;

  // -------------------------------------------------------- Investissements --
  addPage();
  sectionTitle('Investissements');
  paragraph(
    input.priceOrigin === 'live'
      ? `Valorisations issues de données de marché réelles (${input.priceProvider}).`
      : `Valorisations issues de données de DÉMONSTRATION (${input.priceProvider}). Elles ne correspondent pas à des cours réels.`,
    7.5,
    120,
  );

  const columns = [
    { label: 'Support', x: MARGIN, width: 62, align: 'left' as const },
    { label: 'Type', x: MARGIN + 64, width: 20, align: 'left' as const },
    { label: 'Valeur', x: MARGIN + 110, width: 26, align: 'right' as const },
    { label: 'Plus-value', x: MARGIN + 144, width: 24, align: 'right' as const },
    { label: 'Poids', x: MARGIN + CONTENT_WIDTH, width: 18, align: 'right' as const },
  ];

  setFont(7.5, 'bold', 120);
  columns.forEach((column) => doc.text(column.label, column.x, cursor, { align: column.align }));
  cursor += 2;
  doc.setDrawColor(226, 229, 236);
  doc.line(MARGIN, cursor, PAGE_WIDTH - MARGIN, cursor);
  cursor += 4.5;

  const sorted = [...input.investments].sort((a, b) => b.value - a.value);
  for (const investment of sorted) {
    ensureSpace(7);
    setFont(8, 'normal', 40);
    doc.text(doc.splitTextToSize(investment.name, 60)[0] ?? investment.name, columns[0]!.x, cursor);
    setFont(7.5, 'normal', 120);
    doc.text(investment.ticker ?? 'Non coté', columns[1]!.x, cursor);
    setFont(8, 'normal', 40);
    doc.text(formatEuro(investment.value), columns[2]!.x, cursor, { align: 'right' });
    doc.setTextColor(investment.gain >= 0 ? 15 : 190, investment.gain >= 0 ? 143 : 52, investment.gain >= 0 ? 95 : 75);
    doc.text(formatPercent(investment.gainPct, 1), columns[3]!.x, cursor, { align: 'right' });
    setFont(8, 'normal', 40);
    doc.text(formatPercent(investment.weightPct, 1), columns[4]!.x, cursor, { align: 'right' });
    cursor += 5.5;
  }
  cursor += 2;

  // ------------------------------------------------------------- Cohérence --
  sectionTitle('Score de cohérence du patrimoine');
  setFont(22, 'bold', 25);
  doc.text(`${input.score.score}`, MARGIN, cursor + 6);
  setFont(9, 'normal', 130);
  doc.text('/ 100', MARGIN + 14, cursor + 6);
  setFont(10, 'bold', 40);
  doc.text(input.score.label, MARGIN + 30, cursor + 6);
  cursor += 12;

  for (const factor of input.score.factors) {
    ensureSpace(11);
    setFont(8, 'bold', 40);
    doc.text(factor.label, MARGIN, cursor);
    setFont(8, 'normal', 110);
    doc.text(`${factor.score}/100`, PAGE_WIDTH - MARGIN, cursor, { align: 'right' });

    doc.setFillColor(232, 235, 241);
    doc.roundedRect(MARGIN, cursor + 1.5, CONTENT_WIDTH, 1.8, 0.9, 0.9, 'F');
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(MARGIN, cursor + 1.5, (CONTENT_WIDTH * factor.score) / 100, 1.8, 0.9, 0.9, 'F');

    setFont(7, 'normal', 130);
    const lines = doc.splitTextToSize(factor.explanation, CONTENT_WIDTH);
    doc.text(lines.slice(0, 2), MARGIN, cursor + 6.5);
    cursor += 6.5 + Math.min(lines.length, 2) * 3 + 2;
  }

  // ------------------------------------------------- Risques / opportunités --
  addPage();
  const risks = input.insights.filter((item) => item.kind === 'risque').slice(0, 5);
  const opportunities = input.insights.filter((item) => item.kind === 'opportunite').slice(0, 5);

  const renderInsights = (title: string, items: Insight[], color: [number, number, number]) => {
    sectionTitle(title);
    if (items.length === 0) {
      paragraph('Aucun élément détecté dans cette catégorie.');
      return;
    }
    for (const item of items) {
      ensureSpace(20);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(MARGIN, cursor - 3, 1.4, 4, 'F');
      setFont(9, 'bold', 30);
      doc.text(item.title, MARGIN + 4, cursor);
      cursor += 4;
      setFont(7.5, 'normal', 95);
      const finding = doc.splitTextToSize(item.finding, CONTENT_WIDTH - 4);
      doc.text(finding, MARGIN + 4, cursor);
      cursor += finding.length * 3.2 + 1;
      setFont(7.5, 'normal', 60);
      const action = doc.splitTextToSize(`Piste d'analyse : ${item.suggestedAction}`, CONTENT_WIDTH - 4);
      doc.text(action, MARGIN + 4, cursor);
      cursor += action.length * 3.2 + 4;
    }
  };

  renderInsights('Risques identifiés', risks, [209, 52, 75]);
  renderInsights('Opportunités identifiées', opportunities, [15, 143, 95]);

  // -------------------------------------------------------------- Objectifs --
  if (input.goals.length > 0) {
    sectionTitle('Objectifs');
    for (const projection of input.goals) {
      ensureSpace(14);
      setFont(9, 'bold', 30);
      doc.text(projection.goal.label, MARGIN, cursor);
      setFont(8, 'normal', 110);
      doc.text(
        `${formatEuro(projection.goal.currentAmount)} / ${formatEuro(projection.goal.targetAmount)}`,
        PAGE_WIDTH - MARGIN,
        cursor,
        { align: 'right' },
      );

      doc.setFillColor(232, 235, 241);
      doc.roundedRect(MARGIN, cursor + 1.8, CONTENT_WIDTH, 2.2, 1.1, 1.1, 'F');
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.roundedRect(
        MARGIN,
        cursor + 1.8,
        (CONTENT_WIDTH * Math.min(100, projection.progressPct)) / 100,
        2.2,
        1.1,
        1.1,
        'F',
      );

      setFont(7, 'normal', 130);
      doc.text(
        `Échéance ${formatDate(projection.goal.targetDate, 'long')} · capital projeté ${formatEuro(projection.projectedAmount)} · probabilité indicative ${formatPercent(projection.successProbabilityPct, 0)}`,
        MARGIN,
        cursor + 8,
      );
      cursor += 13;
    }
  }

  // ------------------------------------------------------------ Commentaire --
  if (input.advisorComment) {
    sectionTitle('Commentaire du conseiller');
    paragraph(input.advisorComment, 9, 50);
  }

  if (input.actionPlan.length > 0) {
    sectionTitle('Plan d’action proposé');
    input.actionPlan.forEach((item, index) => {
      ensureSpace(8);
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.circle(MARGIN + 1.6, cursor - 1.2, 1.6, 'F');
      setFont(7, 'bold', 255);
      doc.setTextColor(255, 255, 255);
      doc.text(`${index + 1}`, MARGIN + 1.6, cursor - 0.3, { align: 'center' });
      setFont(8.5, 'normal', 50);
      const lines = doc.splitTextToSize(item, CONTENT_WIDTH - 6);
      doc.text(lines, MARGIN + 6, cursor);
      cursor += lines.length * 3.6 + 3;
    });
  }

  sectionTitle('Mentions');
  paragraph(
    'Ce document est un support pédagogique produit automatiquement par PATRIMONIA à partir des informations figurant dans le dossier du client. Les données clients utilisées dans cette démonstration sont fictives. Les analyses, scores et projections présentés constituent des aides à la lecture et ne valent ni recommandation personnalisée, ni conseil en investissement, ni démarchage, au sens de la réglementation applicable.',
    7.5,
    120,
  );
  paragraph(
    `${input.branding.firmName} · ${input.branding.contactEmail} · ${input.branding.contactPhone}`,
    7.5,
    120,
  );

  drawFooter(doc.getNumberOfPages());

  return doc.output('arraybuffer') as ArrayBuffer;
}
