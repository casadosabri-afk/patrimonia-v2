/** Identifiants et primitives partagées par tout le domaine PATRIMONIA. */
export type Id = string;

/** Date ISO 8601 (`YYYY-MM-DD` ou datetime complet). */
export type ISODate = string;

/** Montant exprimé en euros. Jamais formaté : le formatage appartient à l'UI. */
export type Euro = number;

/** Origine d'une donnée affichée. Règle produit : on ne présente jamais une
 *  donnée inventée comme réelle. */
export type DataOrigin =
  /** Donnée de marché réellement récupérée auprès d'un fournisseur externe. */
  | 'live'
  /** Donnée de marché simulée, explicitement identifiée comme démonstration. */
  | 'mock'
  /** Donnée client fictive du jeu de démonstration. */
  | 'fixture';

export interface Sourced<T> {
  data: T;
  origin: DataOrigin;
  provider: string;
  fetchedAt: ISODate;
  /** Message affichable lorsque l'origine n'est pas `live`. */
  notice?: string;
}

export type Trend = 'up' | 'down' | 'flat';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
