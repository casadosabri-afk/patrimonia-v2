import type { DataOrigin, NewsItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { OriginBadge } from '@/components/ui/DataNotice';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRelative } from '@/lib/utils/format';

export function NewsFeed({
  items,
  origin,
  provider,
  limit = 5,
}: {
  items: NewsItem[];
  origin: DataOrigin;
  provider: string;
  limit?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dernières actualités</CardTitle>
        <OriginBadge origin={origin} provider={provider} />
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title="Aucune actualité" description="Le flux d’actualités est momentanément indisponible." />
        ) : (
          <ul className="divide-y divide-border">
            {items.slice(0, limit).map((item) => {
              const content = (
                <>
                  <p className="text-xs leading-snug font-medium text-fg group-hover:text-accent-700">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    {item.source} · {formatRelative(item.publishedAt)}
                  </p>
                </>
              );

              return (
                <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="group">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
