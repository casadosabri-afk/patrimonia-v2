import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { getMarketDataService } from '@/services/market';

const querySchema = z.object({ symbols: z.string().trim().min(1).max(400) });

/** Cotations pour une liste de symboles séparés par des virgules. */
export async function GET(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ symbols: url.searchParams.get('symbols') });
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });

  const symbols = parsed.data.symbols
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean)
    .slice(0, 25);

  const response = await getMarketDataService().getQuotes(symbols);

  return NextResponse.json({
    quotes: Object.fromEntries(response.data),
    origin: response.origin,
    provider: response.provider,
    notice: response.notice ?? null,
  });
}
