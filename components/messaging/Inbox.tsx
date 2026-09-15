'use client';

import { useState } from 'react';
import type { Client, Conversation, Message } from '@/types';
import { Avatar, Badge, Card, CardContent, EmptyState } from '@/components/ui';
import { MessagesSection } from '@/components/clients/sections/MessagesSection';
import { formatRelative, fullName, initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export interface ConversationBundle {
  conversation: Conversation;
  client: Client | null;
  messages: Message[];
  advisorName: string;
}

export function Inbox({ bundles }: { bundles: ConversationBundle[] }) {
  const [selectedId, setSelectedId] = useState(bundles[0]?.conversation.id ?? null);
  const selected = bundles.find((bundle) => bundle.conversation.id === selectedId) ?? null;

  if (bundles.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Aucune conversation"
          description="Les échanges avec vos clients apparaîtront ici."
        />
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="p-2">
          <ul className="space-y-1">
            {bundles.map((bundle) => {
              const active = bundle.conversation.id === selectedId;
              const last = bundle.messages[bundle.messages.length - 1];
              return (
                <li key={bundle.conversation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(bundle.conversation.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-accent-50' : 'hover:bg-surface-2',
                    )}
                  >
                    <Avatar
                      label={bundle.client ? initials(bundle.client.firstName, bundle.client.lastName) : '?'}
                      color={bundle.client?.avatarColor ?? '#4152ab'}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs font-medium text-fg">
                          {bundle.client ? fullName(bundle.client) : 'Client'}
                        </p>
                        {bundle.conversation.unreadForAdvisor > 0 ? (
                          <Badge tone="negative">{bundle.conversation.unreadForAdvisor}</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-fg-subtle">{bundle.conversation.subject}</p>
                      {last ? (
                        <p className="mt-0.5 truncate text-[11px] text-fg-muted">
                          {last.body.slice(0, 60)}
                          {last.body.length > 60 ? '…' : ''}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-fg-subtle">
                        {formatRelative(bundle.conversation.updatedAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {selected ? (
          <MessagesSection
            conversationId={selected.conversation.id}
            messages={selected.messages}
            viewerRole="advisor"
            advisorName={selected.advisorName}
            clientName={selected.client ? fullName(selected.client) : 'Client'}
          />
        ) : (
          <Card>
            <EmptyState title="Sélectionnez une conversation" />
          </Card>
        )}
      </div>
    </div>
  );
}
