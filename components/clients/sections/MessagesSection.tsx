'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '@/types';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Textarea } from '@/components/ui';
import { formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { EMPTY_ACTION_STATE, sendMessageAction } from '@/app/(app)/actions';

export function MessagesSection({
  conversationId,
  messages,
  viewerRole,
  advisorName,
  clientName,
}: {
  conversationId: string | null;
  messages: Message[];
  viewerRole: 'advisor' | 'client';
  advisorName: string;
  clientName: string;
}) {
  const [state, formAction, pending] = useActionState(sendMessageAction, EMPTY_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (!conversationId) {
    return (
      <Card>
        <EmptyState
          title="Aucune conversation"
          description="Aucun échange n’a encore été ouvert avec ce client."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messagerie</CardTitle>
        <p className="text-[11px] text-fg-subtle">{messages.length} message(s)</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {messages.map((message) => {
            const mine = message.authorRole === viewerRole;
            return (
              <li key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[70%]',
                    mine ? 'bg-accent-500 text-white' : 'bg-surface-2 text-fg',
                  )}
                >
                  <p className="text-xs leading-relaxed whitespace-pre-line">{message.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-fg-subtle')}>
                    {message.authorRole === 'advisor' ? advisorName : clientName} ·{' '}
                    {formatDateTime(message.sentAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <form ref={formRef} action={formAction} className="mt-4 flex items-end gap-2">
          <input type="hidden" name="conversationId" value={conversationId} />
          <label className="flex-1">
            <span className="sr-only">Votre message</span>
            <Textarea
              name="body"
              required
              rows={2}
              placeholder="Écrire un message…"
              className="min-h-11"
            />
          </label>
          <Button type="submit" size="icon" loading={pending} aria-label="Envoyer">
            {pending ? null : <Send className="size-4" aria-hidden />}
          </Button>
        </form>

        {state.error ? <p className="mt-2 text-xs text-negative">{state.error}</p> : null}
      </CardContent>
    </Card>
  );
}
