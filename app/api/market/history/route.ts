import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { getMarketDataService } from '@/services/market';
import { MARKET_RANGES } from '@/services/market/provider';

const querySchema = z.object({
  symbol: z.string().trim().min(1).max(24),
  range: z.enum(MARKET_RANGES as [string, ...string[]]).default('1A'),
});

/** Historique de cours. Route protégée : seule une session valide y accède. */
export async function GET(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    symbol: url.searchParams.get('symbol'),
    range: url.searchParams.get('range') ?? '1A',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
  }

  const market = getMarketDataService();
  const response = await market.getHistoricalPrices(
    parsed.data.symbol,
    parsed.data.range as (typeof MARKET_RANGES)[number],
  );

  return NextResponse.json({
    series: response.data,
    origin: response.origin,
    provider: response.provider,
    notice: response.notice ?? null,
  });
}
