import type { Role } from '@/types';

/**
 * Contexte d'accès résolu CÔTÉ SERVEUR à partir de la session.
 *
 * Aucune valeur de ce contexte ne provient du navigateur : le cabinet, le rôle
 * et l'éventuel identifiant client sont relus depuis la session signée ou
 * depuis Supabase à chaque requête.
 */
export interface AccessContext {
  userId: string;
  firmId: string;
  role: Role;
  /** Renseigné uniquement pour un utilisateur de rôle `client`. */
  clientId: string | null;
}

export class AccessDeniedError extends Error {
  constructor(message = "Accès refusé : cette ressource n'appartient pas à votre périmètre.") {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/** Un client n'accède qu'à son propre dossier. */
export function canReadClient(access: AccessContext, clientId: string): boolean {
  if (access.role === 'client') return access.clientId === clientId;
  return true;
}

/** Seuls l'administrateur et le conseiller modifient les données patrimoniales. */
export function canWriteClientData(access: AccessContext): boolean {
  return access.role === 'admin' || access.role === 'advisor';
}

/** L'administration du cabinet est réservée au rôle administrateur. */
export function canAdministerFirm(access: AccessContext): boolean {
  return access.role === 'admin';
}

export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new AccessDeniedError(message);
}
