import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Building2,
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  LineChart,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Calculator,
  Landmark,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  /** Affiché dans la barre de navigation mobile. */
  mobile?: boolean;
  group: 'pilotage' | 'analyse' | 'relation' | 'cabinet' | 'client';
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['advisor', 'admin'], mobile: true, group: 'pilotage' },
  { href: '/clients', label: 'Clients', icon: Users, roles: ['advisor', 'admin'], mobile: true, group: 'pilotage' },
  { href: '/alertes', label: 'Alertes', icon: Bell, roles: ['advisor', 'admin'], mobile: true, group: 'pilotage' },

  { href: '/marches', label: 'Marchés', icon: LineChart, roles: ['advisor', 'admin'], mobile: true, group: 'analyse' },
  { href: '/simulateur', label: 'Simulateur', icon: Calculator, roles: ['advisor', 'admin'], group: 'analyse' },
  { href: '/fiscalite', label: 'Fiscalité', icon: Landmark, roles: ['advisor', 'admin'], group: 'analyse' },

  { href: '/crm', label: 'CRM', icon: Target, roles: ['advisor', 'admin'], group: 'relation' },
  { href: '/calendrier', label: 'Calendrier', icon: CalendarDays, roles: ['advisor', 'admin'], group: 'relation' },
  { href: '/messages', label: 'Messagerie', icon: MessagesSquare, roles: ['advisor', 'admin'], group: 'relation' },
  { href: '/documents', label: 'Documents', icon: FileText, roles: ['advisor', 'admin'], group: 'relation' },

  { href: '/admin', label: 'Cabinet', icon: Building2, roles: ['admin'], group: 'cabinet' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['admin'], group: 'cabinet' },
  { href: '/admin/branding', label: 'Branding', icon: Settings, roles: ['admin'], group: 'cabinet' },
  { href: '/admin/audit', label: 'Journal d’audit', icon: ShieldCheck, roles: ['admin'], group: 'cabinet' },
];

export const CLIENT_NAV_ITEMS: NavItem[] = [
  { href: '/espace-client', label: 'Accueil', icon: Home, roles: ['client'], mobile: true, group: 'client' },
  { href: '/espace-client/patrimoine', label: 'Patrimoine', icon: Wallet, roles: ['client'], mobile: true, group: 'client' },
  { href: '/espace-client/investissements', label: 'Investissements', icon: TrendingUp, roles: ['client'], mobile: true, group: 'client' },
  { href: '/espace-client/objectifs', label: 'Objectifs', icon: Target, roles: ['client'], mobile: true, group: 'client' },
  { href: '/espace-client/documents', label: 'Documents', icon: FileText, roles: ['client'], group: 'client' },
  { href: '/espace-client/conseiller', label: 'Mon conseiller', icon: MessagesSquare, roles: ['client'], mobile: true, group: 'client' },
];

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  pilotage: 'Pilotage',
  analyse: 'Analyse',
  relation: 'Relation client',
  cabinet: 'Cabinet',
  client: 'Mon espace',
};

export function navForRole(role: Role): NavItem[] {
  if (role === 'client') return CLIENT_NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
