'use client';

import { useTransition } from 'react';
import type { UserAccount } from '@/types';
import { Avatar, Badge, Card, CardContent, Switch } from '@/components/ui';
import { ROLE_LABELS } from '@/lib/utils/labels';
import { formatDate, formatRelative, fullName, initials } from '@/lib/utils/format';
import { setUserActiveAction } from '@/app/(app)/admin/actions';

export function UsersTable({ users, currentUserId }: { users: UserAccount[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="p-2 sm:p-4">
        <ul className="divide-y divide-border">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar label={initials(user.firstName, user.lastName)} color={user.avatarColor} size="sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{fullName(user)}</p>
                <p className="truncate text-[11px] text-fg-subtle">
                  {user.email}
                  {user.jobTitle ? ` · ${user.jobTitle}` : ''}
                </p>
              </div>

              <Badge tone={user.role === 'admin' ? 'brand' : user.role === 'advisor' ? 'accent' : 'info'}>
                {ROLE_LABELS[user.role]}
              </Badge>

              <div className="hidden text-right sm:block">
                <p className="text-[11px] text-fg-subtle">Créé le {formatDate(user.createdAt)}</p>
                <p className="text-[11px] text-fg-subtle">
                  {user.lastLoginAt ? `Connexion ${formatRelative(user.lastLoginAt)}` : 'Jamais connecté'}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-fg-muted">{user.active ? 'Actif' : 'Désactivé'}</span>
                <Switch
                  checked={user.active}
                  disabled={isPending || user.id === currentUserId}
                  label={`Activer ou désactiver le compte de ${fullName(user)}`}
                  onChange={(checked) =>
                    startTransition(() => {
                      void setUserActiveAction(user.id, checked);
                    })
                  }
                />
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-3 px-1 text-[11px] text-fg-subtle">
          Un compte désactivé ne peut plus ouvrir de session : le contrôle est effectué côté serveur à chaque
          requête, indépendamment de ce que le navigateur transmet. Votre propre compte ne peut pas être
          désactivé depuis cet écran.
        </p>
      </CardContent>
    </Card>
  );
}
