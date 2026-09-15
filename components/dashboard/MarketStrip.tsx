import type { IndexSnapshot, DataOrigin } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { OriginBadge } from '@/components/ui/DataNotice';
import { TrendPill } from '@/components/ui/TrendPill';
import { formatNumber } from '@/lib/utils/format';

export function MarketStrip({
  indices,
  origin,
  provider,
}: {
  indices: IndexSnapshot[];
  origin: DataOrigin;
  provider: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Marchés</CardTitle>
        <OriginBadge origin={origin} provider={provider} />
      </CardHeader>
      <CardContent>
        {indices.length === 0 ? (
          <p className="py-4 text-center text-xs text-fg-subtle">Aucun indice disponible actuellement.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {indices.map((index) => (
              <li key={index.symbol} className="rounded-xl bg-surface-2 px-3 py-2.5">
                <p className="truncate text-[11px] text-fg-muted">{index.name}</p>
                <p className="mt-0.5 text-sm font-semibold text-fg tabular">
                  {formatNumber(index.value, index.value > 1000 ? 0 : 2)}
                </p>
                <TrendPill value={index.changePct} size="xs" digits={2} className="mt-1" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
