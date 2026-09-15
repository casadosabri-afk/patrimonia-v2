'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import type { SessionUser } from '@/types';
import { ROLE_LABELS } from '@/lib/utils/labels';
import { fullName, initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { Avatar, Badge } from '@/components/ui';
import { signOut } from '@/lib/auth/actions';
import { useTheme } from './ThemeProvider';
import { Logo } from './Logo';
import { GROUP_LABELS, navForRole, type NavItem } from './navigation';

export function Topbar({
  user,
  firmName,
  openAlerts,
  demoMode,
}: {
  user: SessionUser;
  firmName: string;
  openAlerts: number;
  demoMode: boolean;
}) {
  const { resolved, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const items = navForRole(user.role);

  const groups = items.reduce<Record<string, NavItem[]>>((accumulator, item) => {
    (accumulator[item.group] ??= []).push(item);
    return accumulator;
  }, {});

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="safe-top flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="rounded-lg p-2 text-fg-muted hover:bg-surface-2 hover:text-fg lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {demoMode ? (
              <Badge tone="info" className="hidden sm:inline-flex" dot>
                Mode démonstration
              </Badge>
            ) : null}

            {user.role !== 'client' ? (
              <Link
                href="/alertes"
                aria-label={`Alertes ouvertes : ${openAlerts}`}
                className="relative rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <Bell className="size-4.5" aria-hidden />
                {openAlerts > 0 ? (
                  <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[9px] font-semibold text-white">
                    {openAlerts > 99 ? '99+' : openAlerts}
                  </span>
                ) : null}
              </Link>
            ) : null}

            <button
              type="button"
              onClick={toggle}
              aria-label={resolved === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {resolved === 'dark' ? <Sun className="size-4.5" aria-hidden /> : <Moon className="size-4.5" aria-hidden />}
            </button>

            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

            <div className="flex items-center gap-2">
              <Avatar
                label={initials(user.firstName, user.lastName)}
                color={user.avatarColor}
                size="sm"
              />
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-medium text-fg">{fullName(user)}</p>
                <p className="text-[10px] text-fg-subtle">
                  {ROLE_LABELS[user.role]} · {firmName}
                </p>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                aria-label="Se déconnecter"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <LogOut className="size-4.5" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo showTagline firmName={firmName} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto pat-scroll px-3 pb-6">
              {Object.entries(groups).map(([group, groupItems]) => (
                <div key={group} className="mb-5">
                  <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-fg-subtle uppercase">
                    {GROUP_LABELS[group as NavItem['group']]}
                  </p>
                  <ul className="space-y-0.5">
                    {groupItems.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium',
                              active ? 'bg-accent-50 text-accent-700' : 'text-fg-muted',
                            )}
                          >
                            <Icon className="size-4" aria-hidden />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
