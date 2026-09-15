import type { CompanyFinancials, ValuedInvestment } from '@/types';
import { INSTRUMENT_BY_TICKER } from '@/data/demo/instruments';
import { formatEuro, formatNumber, formatPercent } from '@/lib/utils/format';

export interface InvestmentAnalysis {
  /** Points favorables constatés à partir des données du portefeuille. */
  opportunities: string[];
  /** Facteurs de risque identifiables à partir des caractéristiques de la ligne. */
  risks: string[];
  /** Points de vigilance chiffrés, propres au portefeuille du client. */
  watchPoints: string[];
  /** Effet de la ligne sur l'équilibre d'ensemble. */
  portfolioImpact: string;
  /** Lecture pédagogique de la position. */
  explanation: string;
}

/**
 * Analyse d'une ligne d'investissement.
 *
 * L'analyse ne porte que sur des éléments observables : poids dans le
 * portefeuille, performance constatée, devise, type d'instrument, secteur et,
 * lorsque le fournisseur les renvoie, les ratios financiers réels. Aucune
 * information qualitative n'est inventée sur l'émetteur.
 */
export function analyzeInvestment(
  investment: ValuedInvestment,
  context: {
    grossAssets: number;
    financialTotal: number;
    sameSectorValue: number;
    financials?: CompanyFinancials | null;
  },
): InvestmentAnalysis {
  const opportunities: string[] = [];
  const risks: string[] = [];
  const watchPoints: string[] = [];

  const portfolioShare =
    context.grossAssets > 0 ? (investment.value / context.grossAssets) * 100 : 0;
  const financialShare =
    context.financialTotal > 0 ? (investment.value / context.financialTotal) * 100 : 0;
  const sectorShare =
    context.financialTotal > 0 ? (context.sameSectorValue / context.financialTotal) * 100 : 0;
  const definition = investment.ticker ? INSTRUMENT_BY_TICKER.get(investment.ticker) : undefined;

  // — Opportunités -----------------------------------------------------------
  if (investment.gainPct > 15) {
    opportunities.push(
      `Performance positive depuis l'achat : ${formatPercent(investment.gainPct, 1)}, soit ${formatEuro(investment.gain)} de plus-value latente.`,
    );
  }
  if (investment.type === 'etf') {
    opportunities.push(
      "Support diversifié : un ETF répartit l'exposition sur l'ensemble des titres de son indice, ce qui dilue le risque propre à un émetteur.",
    );
  }
  if (investment.region === 'Monde' || investment.region === 'Marchés émergents') {
    opportunities.push(`Diversification géographique apportée au portefeuille (${investment.region}).`);
  }
  if (investment.assetClass === 'obligations') {
    opportunities.push(
      "Composante obligataire : elle amortit généralement les variations de la poche actions et apporte un revenu régulier.",
    );
  }
  if (typeof context.financials?.dividendYieldPct === 'number' && context.financials.dividendYieldPct > 2) {
    opportunities.push(
      `Rendement du dividende constaté : ${formatPercent(context.financials.dividendYieldPct, 2)} (donnée du fournisseur de marché).`,
    );
  }
  if (opportunities.length === 0) {
    opportunities.push(
      "Ligne conservée dans l'allocation : son intérêt s'apprécie au regard de l'objectif auquel elle est rattachée.",
    );
  }

  // — Risques ----------------------------------------------------------------
  if (portfolioShare >= 8) {
    risks.push(
      `Concentration : cette ligne pèse ${formatPercent(portfolioShare, 1)} du patrimoine brut du client.`,
    );
  }
  if (investment.type === 'action') {
    risks.push(
      "Risque spécifique à l'émetteur : la valeur dépend des résultats et des décisions d'une seule entreprise.",
    );
  }
  if (investment.currency !== 'EUR') {
    risks.push(
      `Risque de change : le titre est coté en ${investment.currency}. La valeur en euros varie aussi avec le taux de change.`,
    );
  }
  if (sectorShare >= 25) {
    risks.push(
      `Exposition sectorielle : le secteur « ${investment.sector} » représente ${formatPercent(sectorShare, 1)} des placements financiers.`,
    );
  }
  if (investment.assetClass === 'crypto') {
    risks.push(
      "Volatilité et cadre réglementaire : les crypto-actifs connaissent des variations de forte amplitude et ne bénéficient pas des protections applicables aux instruments financiers classiques.",
    );
  }
  if (investment.type === 'non_cote') {
    risks.push(
      "Liquidité : un actif non coté ne dispose pas de marché organisé. La cession peut être longue et la valorisation reste une estimation.",
    );
  }
  if (definition && definition.volatility >= 0.3) {
    risks.push(
      `Volatilité historique élevée pour ce type de support (environ ${formatPercent(definition.volatility * 100, 0)} en rythme annuel).`,
    );
  }
  if (typeof context.financials?.peRatio === 'number' && context.financials.peRatio > 30) {
    risks.push(
      `Valorisation : le ratio cours/bénéfice s'établit à ${formatNumber(context.financials.peRatio, 1)}, au-dessus des niveaux historiques moyens des grands indices.`,
    );
  }

  // — Points de vigilance ----------------------------------------------------
  watchPoints.push(
    `L'exposition représente ${formatPercent(financialShare, 1)} des placements financiers et ${formatPercent(portfolioShare, 1)} du patrimoine brut.`,
  );
  if (investment.gainPct >= 100) {
    watchPoints.push(
      "La plus-value latente dépasse le montant investi : le traitement fiscal d'une cession mérite d'être anticipé.",
    );
  }
  if (investment.gainPct <= -15) {
    watchPoints.push(
      `Moins-value latente de ${formatPercent(Math.abs(investment.gainPct), 1)} : vérifier si la thèse d'investissement initiale reste valable.`,
    );
  }
  if (investment.priceOrigin !== 'live') {
    watchPoints.push(
      'La valorisation affichée ne provient pas du flux de marché en direct : elle repose sur la dernière valeur connue ou sur une donnée de démonstration.',
    );
  }

  const impact =
    portfolioShare >= 10
      ? `Avec ${formatPercent(portfolioShare, 1)} du patrimoine brut, cette ligne influence directement la trajectoire d'ensemble : une variation de 10 % de son cours déplace le patrimoine de ${formatPercent(portfolioShare / 10, 2)}.`
      : `Avec ${formatPercent(portfolioShare, 1)} du patrimoine brut, cette ligne pèse modérément sur la trajectoire d'ensemble.`;

  const explanation =
    investment.type === 'etf'
      ? "Cette ligne est un fonds indiciel : sa performance suit celle de l'indice répliqué, diminuée des frais de gestion. Elle constitue une brique de diversification plutôt qu'un pari sur une société."
      : investment.type === 'action'
        ? "Cette ligne est une action : sa valeur dépend des résultats de l'entreprise et de la perception du marché. Elle apporte du rendement potentiel et du risque spécifique."
        : investment.type === 'obligation'
          ? "Cette ligne est obligataire : elle verse un revenu et sa valeur évolue en sens inverse des taux d'intérêt."
          : investment.type === 'non_cote'
            ? "Cette ligne n'est pas cotée : sa valorisation repose sur une estimation et sa cession dépend de la recherche d'un acquéreur."
            : "Cette ligne complète l'allocation. Son comportement doit être apprécié au regard de l'objectif auquel elle est rattachée.";

  return { opportunities, risks, watchPoints, portfolioImpact: impact, explanation };
}
