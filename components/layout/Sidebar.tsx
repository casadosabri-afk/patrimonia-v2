'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/types';
import { cn } from '@/lib/utils/cn';
import { Logo } from './Logo';
import { GROUP_LABELS, navForRole, type NavItem } from './navigation';

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard' || href === '/admin' || href === '/espace-client') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, firmName }: { role: Role; firmName: string }) {
  const pathname = usePathname();
  const items = navForRole(role);

  const groups = items.reduce<Record<string, NavItem[]>>((accumulator, item) => {
    (accumulator[item.group] ??= []).push(item);
    return accumulator;
  }, {});

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="px-4 py-5">
        <Link href={role === 'client' ? '/espace-client' : '/dashboard'} className="block">
          <Logo showTagline firmName={firmName} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto pat-scroll px-3 pb-4" aria-label="Navigation principale">
        {Object.entries(groups).map(([group, groupItems]) => (
          <div key={group} className="mb-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider text-fg-subtle uppercase">
              {GROUP_LABELS[group as NavItem['group']]}
            </p>
            <ul className="space-y-0.5">
              {groupItems.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent-50 text-accent-700'
                          : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0', active && 'text-accent-600')} aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <p className="border-t border-border px-4 py-3 text-[10px] leading-relaxed text-fg-subtle">
        Données clients fictives. Analyses fournies à titre pédagogique.
      </p>
    </aside>
  );
}
