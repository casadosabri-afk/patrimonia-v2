import type { Id, ISODate } from './common';

/** Les trois rôles applicatifs. Le rôle n'est jamais lu depuis le navigateur :
 *  il est résolu côté serveur à partir de la session. */
export type Role = 'admin' | 'advisor' | 'client';

export interface Branding {
  firmName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  reportFooter: string;
}

export interface Firm {
  id: Id;
  name: string;
  slug: string;
  createdAt: ISODate;
  branding: Branding;
  plan: 'demo' | 'starter' | 'business';
}

export interface UserAccount {
  id: Id;
  firmId: Id;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  phone: string | null;
  avatarColor: string;
  active: boolean;
  createdAt: ISODate;
  lastLoginAt: ISODate | null;
  /** Renseigné uniquement pour les comptes de rôle `client`. */
  clientId: Id | null;
}

export interface SessionUser {
  id: Id;
  firmId: Id;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  clientId: Id | null;
}

export interface AuditEntry {
  id: Id;
  firmId: Id;
  userId: Id;
  userLabel: string;
  action: string;
  targetType: string;
  targetId: Id | null;
  targetLabel: string | null;
  createdAt: ISODate;
  metadata?: Record<string, string | number | boolean | null>;
}
