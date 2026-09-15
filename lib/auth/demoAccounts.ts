import type { Role } from '@/types';

/**
 * Comptes de DÉMONSTRATION.
 *
 * Ces identifiants n'existent que dans le jeu de démonstration et ne donnent
 * accès à aucune donnée réelle. Le mot de passe unique est volontairement
 * affiché sur l'écran de connexion : il s'agit d'une maquette pédagogique.
 */
export const DEMO_PASSWORD = 'patrimonia';

export interface DemoAccount {
  email: string;
  role: Role;
  label: string;
  description: string;
  firmName: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'thomas@horizon.demo',
    role: 'advisor',
    label: 'Thomas Martin — Conseiller',
    description: 'Portefeuille de clients, analyses, alertes et CRM.',
    firmName: 'Horizon Patrimoine',
  },
  {
    email: 'admin@horizon.demo',
    role: 'admin',
    label: 'Hélène Vasseur — Administratrice',
    description: 'Pilotage du cabinet, utilisateurs, branding et journal d’audit.',
    firmName: 'Horizon Patrimoine',
  },
  {
    email: 'jean.dupont@exemple.demo',
    role: 'client',
    label: 'Jean Dupont — Client',
    description: 'Espace client simplifié : patrimoine, investissements, documents.',
    firmName: 'Horizon Patrimoine',
  },
  {
    email: 'advisor@meridien.demo',
    role: 'advisor',
    label: 'Nadia Perrot — Conseillère',
    description: 'Second cabinet, pour vérifier le cloisonnement des données.',
    firmName: 'Méridien Conseil',
  },
];
