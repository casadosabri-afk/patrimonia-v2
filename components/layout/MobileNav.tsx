'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/types';
import { cn } from '@/lib/utils/cn';
import { navForRole } from './navigation';

/** Barre de navigation basse, affichée sous le breakpoint desktop. */
export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role).filter((item) => item.mobile);

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden"
    >
      <ul className="safe-bottom flex">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-accent-600' : 'text-fg-subtle',
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
